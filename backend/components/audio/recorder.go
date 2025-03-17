package audio

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"os"
	"path"
	"sync"

	"github.com/gen2brain/malgo"
)

type Recorder struct {
	ctx      *malgo.AllocatedContext
	device   *malgo.Device
	buffer   *bytes.Buffer
	mutex    sync.Mutex
	isActive bool
}

var (
	recorder     *Recorder
	recorderOnce sync.Once
)

// WAV header structure
type wavHeader struct {
	ChunkID       [4]byte // "RIFF"
	ChunkSize     uint32  // 36 + SubChunk2Size
	Format        [4]byte // "WAVE"
	SubChunk1ID   [4]byte // "fmt "
	SubChunk1Size uint32  // 16 for PCM
	AudioFormat   uint16  // 1 for PCM
	NumChannels   uint16  // 1 for mono
	SampleRate    uint32  // 44100
	ByteRate      uint32  // SampleRate * NumChannels * BitsPerSample/8
	BlockAlign    uint16  // NumChannels * BitsPerSample/8
	BitsPerSample uint16  // 16
	SubChunk2ID   [4]byte // "data"
	SubChunk2Size uint32  // size of audio data
}

func GetRecorder() (*Recorder, error) {
	var initErr error
	recorderOnce.Do(func() {
		ctx, err := malgo.InitContext(nil, malgo.ContextConfig{}, nil)
		if err != nil {
			initErr = fmt.Errorf("failed to initialize context: %v", err)
			return
		}

		recorder = &Recorder{
			ctx:    ctx,
			buffer: &bytes.Buffer{},
		}
	})

	if initErr != nil {
		return nil, initErr
	}
	return recorder, nil
}

func (r *Recorder) StartRecording() error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if r.isActive {
		return fmt.Errorf("recording is already in progress")
	}

	// Check and delete existing recording
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return fmt.Errorf("failed to get cache directory: %v", err)
	}
	recordingPath := path.Join(cacheDir, "bcards_recording.wav")
	if _, err := os.Stat(recordingPath); err == nil {
		if err := os.Remove(recordingPath); err != nil {
			return fmt.Errorf("failed to delete existing recording: %v", err)
		}
	}

	deviceConfig := malgo.DefaultDeviceConfig(malgo.Capture)
	deviceConfig.Capture.Format = malgo.FormatS16
	deviceConfig.Capture.Channels = 1
	deviceConfig.SampleRate = 44100
	deviceConfig.Alsa.NoMMap = 1

	onData := func(pOutput, pInput []byte, frameCount uint32) {
		r.mutex.Lock()
		defer r.mutex.Unlock()

		if r.isActive {
			r.buffer.Write(pInput)
		}
	}

	callbacks := malgo.DeviceCallbacks{
		Data: onData,
	}

	device, err := malgo.InitDevice(r.ctx.Context, deviceConfig, callbacks)
	if err != nil {
		return fmt.Errorf("failed to initialize device: %v", err)
	}

	err = device.Start()
	if err != nil {
		return fmt.Errorf("failed to start device: %v", err)
	}

	r.device = device
	r.isActive = true
	r.buffer.Reset()

	return nil
}

func (r *Recorder) StopRecording() error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if !r.isActive {
		return fmt.Errorf("no recording in progress")
	}

	r.isActive = false
	if r.device != nil {
		r.device.Stop()
		r.device.Uninit()
		r.device = nil
	}

	// Save the audio data as WAV
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return fmt.Errorf("failed to get cache directory: %v", err)
	}

	recordingPath := path.Join(cacheDir, "bcards_recording.wav")
	err = r.saveToWAV(recordingPath)
	if err != nil {
		return fmt.Errorf("failed to save recording: %v", err)
	}

	return nil
}

func (r *Recorder) saveToWAV(filepath string) error {
	f, err := os.Create(filepath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer f.Close()

	// Prepare WAV header
	audioData := r.buffer.Bytes()
	header := wavHeader{
		ChunkID:       [4]byte{'R', 'I', 'F', 'F'},
		ChunkSize:     uint32(36 + len(audioData)),
		Format:        [4]byte{'W', 'A', 'V', 'E'},
		SubChunk1ID:   [4]byte{'f', 'm', 't', ' '},
		SubChunk1Size: 16,
		AudioFormat:   1, // PCM
		NumChannels:   1, // Mono
		SampleRate:    44100,
		BitsPerSample: 16,
		SubChunk2ID:   [4]byte{'d', 'a', 't', 'a'},
		SubChunk2Size: uint32(len(audioData)),
	}

	// Calculate derived values
	header.ByteRate = header.SampleRate * uint32(header.NumChannels) * uint32(header.BitsPerSample) / 8
	header.BlockAlign = header.NumChannels * header.BitsPerSample / 8

	// Write header
	if err := binary.Write(f, binary.LittleEndian, header); err != nil {
		return fmt.Errorf("failed to write WAV header: %v", err)
	}

	// Write audio data
	if _, err := f.Write(audioData); err != nil {
		return fmt.Errorf("failed to write audio data: %v", err)
	}

	return nil
}

func (r *Recorder) Cleanup() {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if r.device != nil {
		r.device.Stop()
		r.device.Uninit()
		r.device = nil
	}

	if r.ctx != nil {
		r.ctx.Uninit()
		r.ctx = nil
	}
}
