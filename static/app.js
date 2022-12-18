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

    let foundGrid = null;
    let foundUrl = null;

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
                        'different_from': foundGrid,
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
                            alert(foundGrid ? 'No other solution found.' : 'No solution found.');
                            return;
                        }
                        iframe.contentWindow.load(body.url);
                        foundGrid = body.grid;
                        foundUrl = exp();
                    }
                }).catch(e => {
                    alert('Unexpected error: ' + e);
                }).finally(() => {
                    solveButton.textContent = exp() === foundUrl ? 'Find another solution' : 'Solve';
                    solveButton.disabled = false;
                });
            });
        });
    });

    iframe.contentWindow.document.addEventListener('click', () => iframe.contentWindow.focus());

    setInterval(() => {
        if (solveButton.textContent === 'Solve' || exp() !== foundUrl) {
            foundGrid = null;
            foundUrl = null;
            solveButton.textContent = 'Solve';
        }
    }, 1000);
};
