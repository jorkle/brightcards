export namespace chat {
	
	export class Flashcard {
	    front: string;
	    back: string;
	
	    static createFrom(source: any = {}) {
	        return new Flashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.front = source["front"];
	        this.back = source["back"];
	    }
	}

}

export namespace models {
	
	export class DeckModel {
	    ID: number;
	    Name: string;
	    Description: string;
	    Purpose: string;
	    EnableAutoRephrase: boolean;
	    EnableInitialismSwap: boolean;
	    MaxRephrasedCards: number;
	    CardCount: number;
	    LastReviewed?: string;
	    CreatedAt: string;
	    UpdatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new DeckModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.Purpose = source["Purpose"];
	        this.EnableAutoRephrase = source["EnableAutoRephrase"];
	        this.EnableInitialismSwap = source["EnableInitialismSwap"];
	        this.MaxRephrasedCards = source["MaxRephrasedCards"];
	        this.CardCount = source["CardCount"];
	        this.LastReviewed = source["LastReviewed"];
	        this.CreatedAt = source["CreatedAt"];
	        this.UpdatedAt = source["UpdatedAt"];
	    }
	}
	export class FlashcardModel {
	    ID: number;
	    Front: string;
	    Back: string;
	    DeckId: number;
	    CardType: string;
	    Source: string;
	    FSRSDifficulty: number;
	    FSRSStability: number;
	    // Go type: time
	    DueDate: any;
	    LastReviewed?: string;
	    Difficulty?: string;
	    CreatedAt: string;
	    UpdatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new FlashcardModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Front = source["Front"];
	        this.Back = source["Back"];
	        this.DeckId = source["DeckId"];
	        this.CardType = source["CardType"];
	        this.Source = source["Source"];
	        this.FSRSDifficulty = source["FSRSDifficulty"];
	        this.FSRSStability = source["FSRSStability"];
	        this.DueDate = this.convertValues(source["DueDate"], null);
	        this.LastReviewed = source["LastReviewed"];
	        this.Difficulty = source["Difficulty"];
	        this.CreatedAt = source["CreatedAt"];
	        this.UpdatedAt = source["UpdatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace services {
	
	export class FeynmanAnalysis {
	    strongspots: string;
	    weakspots: string;
	    resources: string[];
	
	    static createFrom(source: any = {}) {
	        return new FeynmanAnalysis(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.strongspots = source["strongspots"];
	        this.weakspots = source["weakspots"];
	        this.resources = source["resources"];
	    }
	}

}

