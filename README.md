# README

## Initial Release (Version 1.0)

I created this as I was using Anki and wanted the benefit of spaced repetition but with some additional features. After creating this I've noticed there are a few AI powered spaced repetition applications available, but they all require a subscription or licensing. For that reason amongst others I am releasing this for free under the GNU GPL 2.0 open source license. I was able to create this from beginning to end in its entirety in the last four days. FSRS algorithm is open source, so should the software that is leveraging it.

### Features

- Spaced Repetition Flashcards (Implemented the FSRS v5 algorithm)
- AI powered "Feynman Flashcards" which present you with a concept (flashcard front) and you explain the concept outloud into your default microphone and the AI listens to your explanation and highlights the strong points and weak spots of your explanation.
- Ability to generate multiple flashcards from the contents of your clipboard using AI.

### Disclaimer

- The only outbound network requests are to the OpenAI API.
- The OpenAI API key that you configure on the settings page will be stored in cleartext in a sqlite database locally on your machine.
- Using the AI features requires an OpenAI API key to be configured. The OpenAI API requires credits, although they are inexpensive.

---
Checksums:

```
be0fb11d655c064f86db4842b1462fba1d91ed7499550960eb64327513ce90d2  ./bcards
05f742f73a99dc6732106e6ee75c69762d2aa45d2dab8490ccf812b059e73f72  ./bcards.exe
```

VirusTotal: [https://www.virustotal.com/gui/file/05f742f73a99dc6732106e6ee75c69762d2aa45d2dab8490ccf812b059e73f72](https://www.virustotal.com/gui/file/05f742f73a99dc6732106e6ee75c69762d2aa45d2dab8490ccf812b059e73f72)

## Examples
### Decks page
![Decks page](https://i.imgur.com/G7Ykq7e.png)

### Flashcard Generation (from clipboard contents)
![Flashcard Generation](https://i.imgur.com/lyf4SW6.png)

### Modified Feynman Method (Practice explanation)
![](https://i.imgur.com/XWLsBTc.png)
![](https://i.imgur.com/kh7P7sk.png)

## License

[https://github.com/jorkle/brightcards/LICENSE]()
