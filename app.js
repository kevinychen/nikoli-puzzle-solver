window.onload = function () {
    const select = document.getElementById('type');
    const iframe = document.getElementById('iframe');
    const solveButton = document.getElementById('solve');

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
                iframe.contentWindow.ui.puzzle.open(body['pzprv3']);
                solveButton.textContent = 'Solve';
                solveButton.disabled = false;
            })
        });
    });
};
