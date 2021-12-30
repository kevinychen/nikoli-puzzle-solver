function getCurrentPzprv3() {
    return iframe.contentWindow.ui.puzzle.getFileData().replaceAll('\n', '/');
}

window.onload = function () {
    const select = document.getElementById('type');
    const iframe = document.getElementById('iframe');
    const solveButton = document.getElementById('solve');
    const demoButton = document.getElementById('demo');

    let foundSolution = null;

    fetch('/api/list').then(response => {
        response.json().then(body => {
            const puzzles = body.puzzles;
            for (const solver of puzzles) {
                const option = document.createElement('option');
                option.value = solver.type;
                option.text = solver.name;
                select.add(option);
            }
            iframe.src = '/p.html?' + select.value;

            demoButton.addEventListener('click', function () {
                iframe.contentWindow.ui.puzzle.open(puzzles.find(puzzle => puzzle.type === select.value).demo);
            });
        });
    })

    select.addEventListener('change', function(e) {
        iframe.src = '/p.html?' + e.target.value;
    });

    solveButton.addEventListener('click', function() {
        solveButton.textContent = 'Solving...';
        solveButton.disabled = true;
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({
                'pzprv3': getCurrentPzprv3(),
                'different_from': foundSolution,
            }),
            headers: { 'Content-type': 'application/json' },
        }).then(async response => {
            if (response.status == 408) {
                alert('Timeout exceeded.');
            } else if (response.status == 500) {
                alert('An unknown error occurred.');
            } else if (response.status == 503) {
                alert('The server is too busy. Please try again later.');
            } else {
                body = await response.json();
                if (body.pzprv3 === null) {
                    alert('No solution found.');
                } else {
                    foundSolution = body.pzprv3;
                    iframe.contentWindow.ui.puzzle.open(foundSolution);
                }
            }
            solveButton.textContent = getCurrentPzprv3() === foundSolution ? 'Find another solution' : 'Solve';
            solveButton.disabled = false;
        });
    });

    setInterval(() => {
        puzzle = iframe.contentWindow.ui.puzzle;
        select.value = puzzle.pid;
        if (getCurrentPzprv3() !== foundSolution) {
            foundSolution = null;
            solveButton.textContent = 'Solve';
        }
    }, 1000);
};
