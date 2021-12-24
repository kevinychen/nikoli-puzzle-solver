window.onload = function () {
    const select = document.getElementById('type');
    const iframe = document.getElementById('iframe');

    select.addEventListener('change', function(e) {
        iframe.src = '/p.html?' + e.target.value;
    });

    document.getElementById('solve').addEventListener('click', function() {
        fetch('/api/solve', {
            method: 'POST',
            body: JSON.stringify({'puzzle': iframe.contentWindow.ui.puzzle.getFileData().replaceAll('\n', '/')}),
            headers: { 'Content-type': 'application/json' },
        }).then(response => {
            response.json().then(body => {
                iframe.contentWindow.ui.puzzle.open(body['puzzle']);
            })
        });
    });
};
