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
            for (let i = 0; i < puzzles.length; i++) {
                for (const select of [sampleSelect, typeSelect]) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.text = puzzles[i].type;
                    if (puzzles[i].alternate) {
                        if (select === sampleSelect) {
                            option.text += ` (${puzzles[i].alternate})`;
                        } else {
                            continue;
                        }
                    }
                    select.add(option);
                }
            }

            sampleSelect.addEventListener('change', () => {
                const puzzle = puzzles[sampleSelect.value];
                imp(puzzle.sample);
                typeSelect.value = puzzles.findIndex(otherPuzzle => puzzle.type === otherPuzzle.type);
                sampleSelect.value = '';
                parameters.value = puzzle.parameters;
                parameters.style.display = puzzle.parameters ? 'block' : 'none';
            });

            typeSelect.addEventListener('change', () => {
                const puzzle = puzzles[typeSelect.value];
                parameters.value = puzzle.parameters;
                parameters.style.display = puzzle.parameters ? 'block' : 'none';
            });

            solveButton.addEventListener('click', () => {
                solveButton.textContent = 'Solving...';
                solveButton.disabled = true;
                fetch('/api/solve', {
                    method: 'POST',
                    body: JSON.stringify({
                        'type': puzzles[typeSelect.value].type,
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
                            alert(foundSolution ? 'No other solution found.' : 'No solution found.');
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
