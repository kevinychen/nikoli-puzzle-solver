function exp() {
    return iframe.contentWindow.pu.maketext().split('#')[1];
}

function imp(penpa) {
    iframe.contentWindow.load(penpa);
}

window.onload = function () {
    const iframe = document.getElementById('iframe');
    const sampleSelect = document.getElementById('sample');
    const typeSelect = document.getElementById('type');
    const parameters = document.getElementById('parameters');
    const solveButton = document.getElementById('solve');

    let foundSolution = null;
    let localFoundSolution = null;

    fetch('/api/list').then(response => {
        response.json().then(body => {
            const puzzles = body.puzzles;
            for (const solver of puzzles) {
                for (const select of [sampleSelect, typeSelect]) {
                    const option = document.createElement('option');
                    option.value = solver.type;
                    option.text = solver.type;
                    select.add(option);
                }
            }

            sampleSelect.addEventListener('change', () => {
                const puzzle = puzzles.find(puzzle => puzzle.type === sampleSelect.value);
                imp(puzzle.sample);
                typeSelect.value = sampleSelect.value;
                sampleSelect.value = '';
                parameters.value = puzzle.parameters;
                parameters.style.display = puzzle.parameters ? 'block' : 'none';
            });

            typeSelect.addEventListener('change', () => {
                const puzzle = puzzles.find(puzzle => puzzle.type === typeSelect.value);
                parameters.value = puzzle.parameters;
                parameters.style.display = puzzle.parameters ? 'block' : 'none';
            });
        });
    })

    solveButton.addEventListener('click', () => {
        solveButton.textContent = 'Solving...';
        solveButton.disabled = true;
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({
                'type': typeSelect.value,
                'url': exp(),
                'parameters': parameters.value,
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
