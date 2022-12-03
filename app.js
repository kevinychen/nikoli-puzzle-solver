function getCurrentPenpa() {
    return iframe.contentWindow.pu.maketext().split('#')[1];
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
                option.text = solver.type;
                select.add(option);
            }

            demoButton.addEventListener('click', function () {
                iframe.contentWindow.load(puzzles.find(puzzle => puzzle.type === select.value).demo);
            });
        });
    })

    solveButton.addEventListener('click', function() {
        solveButton.textContent = 'Solving...';
        solveButton.disabled = true;
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({
                'type': select.value,
                'penpa': getCurrentPenpa(),
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
                if (body.penpa === null) {
                    alert('No solution found.');
                } else {
                    foundSolution = body.penpa;
                    iframe.contentWindow.load(foundSolution);
                }
            }
            solveButton.textContent = getCurrentPenpa() === foundSolution ? 'Find another solution' : 'Solve';
            solveButton.disabled = false;
        });
    });

    setInterval(() => {
        if (solveButton.textContent === 'Find another solution' && getCurrentPenpa() !== foundSolution) {
            foundSolution = null;
            solveButton.textContent = 'Solve';
        }
    }, 1000);
};
