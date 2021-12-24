from flask import Flask, request
from solvers import sudoku

app = Flask(__name__)
SOLVERS = {
    'sudoku': sudoku.solve,
}


@app.route("/")
def root():
    with open('index.html', 'r') as file:
        return file.read()


@app.route("/app.js")
def js():
    with open('app.js', 'r') as file:
        return file.read()


@app.route("/api/solve", methods=['POST'])
def solve():
    return {
        'puzzle': SOLVERS[request.json['type']](request.json['puzzle'])
    }
