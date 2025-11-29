export class GamePlayer {
    constructor(uiElementId) {
        this.players = ["Joueur 1", "Joueur 2"];
        this.current = 0; // Index of player in the array
        this.state = "select"; 
        /*
            Only 2 states possible : 
            - "select" : select a pawn for the opponent
            - "place"  : place the pawn given by the opponent
        */

        this.ui = document.getElementById(uiElementId);
        this.updateText();
    }

    // Return the actual player (string of his name)
    get currentPlayer() {
        return this.players[this.current];
    }

    // Return the opponent player
    get opponentPlayer() {
        return this.players[(this.current + 1) % 2];
    }

    // Update the text with turn's state
    updateText() {
        if (this.state === "select") {
            this.ui.innerText = 
                `${this.currentPlayer} : sélectionnez une pièce pour ${this.opponentPlayer}`;
        } 
        else if (this.state === "place") {
            this.ui.innerText = 
                `${this.opponentPlayer} : placez la pièce que ${this.currentPlayer} vous a donnée`;
        }
    }

    // When a pawn is selected
    onSelectPiece() {
        if (this.state !== "select") return false;

        // The turn is now in state "place the pawn"
        this.state = "place";
        this.updateText();
        return true;
    }

    // When a pawn is placed into the board
    onPlacePiece() {
        if (this.state !== "place") return false;

        // End of the turn, the player change
        this.current = (this.current + 1) % 2;
        this.state = "select";
        this.updateText();
        return true;
    }
}
