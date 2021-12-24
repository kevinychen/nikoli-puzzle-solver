from flask import Flask, request, Response
from re import match
from solvers import nurikabe, sudoku

app = Flask(__name__)
SOLVERS = {
    'nurikabe': nurikabe.solve,
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


@app.route("/<path:path>")
def pzprjs(path):
    if path.endswith('.js'):
        mimetype = 'application/javascript'
    elif path.endswith('.css'):
        mimetype = 'text/css'
    else:
        mimetype = 'text/html'
    with open('pzprjs/dist/' + path) as file:
        return Response(file.read(), mimetype=mimetype)


@app.route("/api/solve", methods=['POST'])
def solve():
    puzzle = request.json['puzzle']
    matched = match('pzprv3/([^/]+)/.*', puzzle)
    puzzle_type = matched.group(1)
    return {
        'puzzle': SOLVERS[puzzle_type](puzzle)
    }
