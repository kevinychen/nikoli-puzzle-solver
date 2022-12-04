from flask import abort, Flask, request, send_from_directory, send_file

import solvers

app = Flask(__name__)


@app.route("/")
def root():
    return send_file('index.html')


@app.route("/app.js")
def js():
    return send_file('app.js')


@app.route("/favicon.ico")
def favicon():
    return send_file('favicon.ico')


@app.route("/penpa-edit/", defaults={'path': ''})
@app.route("/penpa-edit/<path:path>")
def penpa(path):
    return send_from_directory('penpa-edit/docs', path or 'index.html')


@app.route("/api/list", methods=['GET'])
def puzzle_list():
    return {'puzzles': solvers.puzzle_list()}


@app.route("/api/solve", methods=['POST'])
def solve():
    try:
        return {'url': solvers.solve(
            request.json['type'],
            request.json['url'],
            request.json['different_from'])}
    except TimeoutError as e:
        abort(e.args[0])
