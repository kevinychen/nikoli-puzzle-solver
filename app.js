window.onload = function () {
    const select = document.getElementById('type');
    const iframe = document.getElementById('iframe');
    const solveButton = document.getElementById('solve');

    fetch('/api/list').then(response => {
        response.json().then(body => {
            for (const solver of body.puzzles) {
                const option = document.createElement('option');
                option.value = solver.type;
                option.text = solver.name;
                select.add(option);
            }
            iframe.src = '/p.html?' + select.value;
        })
    })

    select.addEventListener('change', function(e) {
        iframe.src = '/p.html?' + e.target.value;
    });

    solveButton.addEventListener('click', function() {
        solveButton.textContent = 'Solving...';
        solveButton.disabled = true;
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({'pzprv3': iframe.contentWindow.ui.puzzle.getFileData().replaceAll('\n', '/')}),
            headers: { 'Content-type': 'application/json' },
        }).then(response => {
            response.json().then(body => {
                if (body.pzprv3 === null) {
                    alert('No solution found (or timeout exceeded).');
                } else {
                    iframe.contentWindow.ui.puzzle.open(body.pzprv3);
                }
                solveButton.textContent = 'Solve';
                solveButton.disabled = false;
            })
        });
    });
};
