// import { posToId } from "../Utils/posIdConversion.js";
import { idToPos, posToId } from '../chessUtils.ts';
// import { Board } from "./board.js";
import { ChessBoard as Board } from './chessBoard.js';

export function Piece(color, square, board){
    this.color = color;
    this.square = square;
    this.board = board;
    this.taken = false
}

Piece.prototype.getColor = function(){
    return this.color;
}

Piece.prototype.getFen = function(){
    return this.fenChar;
}

Piece.prototype.getSquare = function(){
    return this.square;
}

Piece.prototype.getSquareId = function(){
    const pos = this.getSquare();
    return posToId(pos);
}
Piece.prototype.getType = function(){
    return this.type;
}

Piece.prototype.getPieceName = function(){
    return this.pieceName;
}

Piece.prototype.setSquare = function(pos){
    this.square = pos;
}

Piece.prototype.setBoard = function(board){
    this.board = board;
}

Piece.prototype.getBoard = function(){
    return this.board.board;
}

Piece.prototype.isTaken = function(){
    return this.taken;
}



Piece.prototype.getMoves = function(){
    // debugger
    const validMoves = this.validMoves();
    const options = new Set();
    const takeOptions = new Set();
    validMoves[0].forEach( pos => {
        if (Board.isInsideBoard(pos)){
            options.add(posToId(pos));
        }
    });
    validMoves[1].forEach( pos => {
        if (Board.isInsideBoard(pos)){
            takeOptions.add(posToId(pos));
        }
    });
    this.board.addCastleOptions(this,options);

    return { options, takeOptions }
}

Piece.prototype.allMoveOptions = function(){
    const validMoves = this.validMoves();
    const moves = validMoves[0].filter(pos => Board.isInsideBoard(pos));
    const takes = validMoves[1].filter(pos => Board.isInsideBoard(pos));

    const moveArr = [...moves, ...takes].map(pos => posToId(pos));
    return new Set(moveArr);
}

Piece.prototype.getFenChar = function(){
    return this.fenChar;
}