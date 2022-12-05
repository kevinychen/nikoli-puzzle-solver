function exp() {
    return iframe.contentWindow.pu.maketext().split('#')[1];
}

function imp(penpa) {
    iframe.contentWindow.load(penpa);
}

window.onload = function () {
    const iframe = document.getElementById('iframe');
    const demoButton = document.getElementById('demo');
    const select = document.getElementById('type');
    const solveButton = document.getElementById('solve');

    let foundSolution = null;
    let localFoundSolution = null;

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
                imp(puzzles.find(puzzle => puzzle.type === select.value).demo);
            });
        });
    })

    solveButton.addEventListener('click', () => {
        solveButton.textContent = 'Solving...';
        solveButton.disabled = true;
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({
                'type': select.value,
                'url': exp(),
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
                if (body.url === null) {
                    alert('No solution found.');
                } else {
                    foundSolution = body.url;
                    iframe.contentWindow.load(foundSolution);
                    localFoundSolution = exp();
                }
            }
            solveButton.textContent = exp() === localFoundSolution ? 'Find another solution' : 'Solve';
            solveButton.disabled = false;
        });
    });

    iframe.contentWindow.document.addEventListener('click', () => iframe.contentWindow.focus());

    setInterval(() => {
        if (solveButton.textContent === 'Find another solution' && exp() !== localFoundSolution) {
            foundSolution = null;
            localFoundSolution = null;
            solveButton.textContent = 'Solve';
        }
    }, 1000);
};
