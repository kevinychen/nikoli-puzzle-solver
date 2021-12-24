
pzpr.on('load', function () {
    canvas = document.getElementById('canvas');
    select = document.getElementById('type');

    type = undefined;
    puzzle = new pzpr.Puzzle(canvas, { type: 'editor' });
    pzpr.connectKeyEvents(puzzle);

    function setPuzzleType(newType) {
        type = newType;
        switch (newType) {
            case 'sudoku':
                puzzle.open('pzprv3/sudoku/9');
                break;
            case 'nurikabe':
                puzzle.open('pzprv3/nurikabe/10/10');
                break;
        }
    }
    select.addEventListener('change', e => setPuzzleType(e.target.value));
    setPuzzleType('sudoku');

    document.getElementById('solve').addEventListener('click', function() {
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({'type': type, 'puzzle': puzzle.getFileData().replaceAll('\n', '/')}),
            headers: { 'Content-type': 'application/json' },
        }).then(response => {
            response.json().then(body => {
                puzzle.open(body['puzzle']);
            })
        });
    });

    document.getElementById('load').addEventListener('click', function() {
        puzzle.open(prompt('Enter puzzle data:'));
        type = select.value = puzzle.pid;
    });
});
