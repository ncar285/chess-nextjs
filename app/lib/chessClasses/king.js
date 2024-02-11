import { inherit } from './inherit.js';
import { Piece } from './piece.js';

const DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];

export function King(color, square, board){
    this.pieceName = "king";
    this.type = color.slice(0,1) + "_" + this.pieceName;
    Piece.call(this, color, square, board);
    this.firstMove = true;
}

inherit(Piece, King);

King.prototype.getType = function(){
    return this.type;
}

King.prototype.validMoves = function(){
    const [rank, file] = this.getSquare();
    const color = this.getColor()
    const isWhite = color === "white";
    const opponentColor = isWhite ? "black" : "white";
    const options = [];
    const takeOptions = [];

    DIRS.forEach(step => {
        const newRank = rank + step[0];
        const newFile = file + step[1];
        const potentialMove = [newRank,newFile]

        if (!this.board.isOccupiedByColor(potentialMove,color)){

            if (this.board.isOccupiedByColor(potentialMove,opponentColor)){
                takeOptions.push(potentialMove);
            } else {
                options.push(potentialMove);
            }

        }
    })

    return [options,takeOptions];
}