export namespace models {
	
	export class DeckModel {
	    ID: number;
	    Name: string;
	    Description: string;
	    Purpose: string;
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
	    FSRSDifficulty: number;
	    FSRSStability: number;
	    DaysTillDue: number;
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
	        this.FSRSDifficulty = source["FSRSDifficulty"];
	        this.FSRSStability = source["FSRSStability"];
	        this.DaysTillDue = source["DaysTillDue"];
	        this.LastReviewed = source["LastReviewed"];
	        this.Difficulty = source["Difficulty"];
	        this.CreatedAt = source["CreatedAt"];
	        this.UpdatedAt = source["UpdatedAt"];
	    }
	}

}

