import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // A number indicates the amount of shaded cells in the given direction
    // If a clue is shaded, the number becomes meaningless (it may be true or false)
    for (const [p, text] of puzzle.texts) {
        const [v] = puzzle.symbols.get(p).getArrows();
        cs.add(
            Or(grid.get(p).eq(1), Sum(...puzzle.points.sightLine(p, v).map(p => grid.get(p).eq(1))).eq(parseInt(text)))
        );
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Yajisan Kazusan",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVNb9pAEL3zK6I978EfQMC3JA29UNoUqiiyLLSACVZslq7tpjLiv2dmbGSvbSTnEDWHavFoePu8+3bnw/HvVCifD2DYI25wE4ZljejpG/g7j0WQhL5zxW/SZCcVOJx/n0z4VoSx33MLltc7ZmMne+DZV8dlJuPMgsdkHs8enGP2zclmPJvDFOMmYNOcZIF7X7qPNI/eXQ6aBvizwgf3CVyhlHxdbmWq/M2zv7zNZ344brbgDPe7pVXQZZH847NCD/5fy2gVILASCRwq3gWHYiZON/IlLbimd+LZTS573iLbLmWjm8tGr0U2ngZlrwO1Dv3l9APkjr3TCa7/JwheOi5q/1W6o9KdO0ewM+fILANfhQiZeYyYZdaB/vkuCsAmRhWwETAqwLjG6NcX7V/XGfRKZY3BEAG7AtQXHerS4UAmHevpfKxzRtIwITN5e8rkZ+7OxgsBNnDKcZFNt9WdjVdZUUJvXWbjlXTWTUEgdkXLZTZGqLMSCl9nNsW2s24KfGfdlBUd2ZAsE0oZi+wCioNnNtkvZA2yA7JT4tyTfSR7R7ZPdkicayyvdxVgNWs/SI5r5T0dx6Cb5/VcNkujla+uZlJFIoRmM9+Jg8+gu7NYhss4VVuxhh5FzR/aEGB7ekODQikPYbDXecHzXiq/dQpBjE8LfyXVprb6qwhDDcg/ZRqUd1sNShS00sp/Sg0NiUSy04BK29VW8veJLiARukTxImq7ReWZTz32l9Hj2pCm9v9P5z/+dGIojM9Wv59NDmWxVK0tAOCWLgBoa7UXeKPgAW+UNm7YrG5AWwoc0HqNA9QscwAblQ7YhWLHVev1jqrqJY9bNaoet6oWvuv13gA=",
            answer: "m=edit&p=7VXfb9owEH7nr6j87Ic4DpTkre3avXRsHZ2qKkIo0LREDbhzknUK4n/v3TlAnKQTPFTbw2RyOT5fzp99P5z9LCId8z4MOeQOFzBcd0iP5+BvO26TPI2DE35W5AulQeH869UVf4zSLO6FldWkty79oLzh5ecgZIJx5sIj2ISXN8G6/BKUI16OYYpxAdi1MXJBvdyrdzSP2oUBhQP6qNJBvQc10lq9Th9VoeOHp3h6bma+BWF5yxmud05eUGVL9StmFR/8P1fLWYLALMphU9kiealmsuJBPRdsu9SGl2eG9riDttzTljvaspu2W9GeJ3qextPrD6DrTzYbOP7vQHgahMj9x14d7tVxsN4grzVzHfwUIiRMjJgrmoC3PYsKkKIJSAScGuA3LLymU++0aeE3fPQHCMga0HQ6sKnDhgRt6367rXCfuZjVEIrulDF7PtzaM9aiZv++tRRHWUubifiztX8Mb2+3S3EAE4rQwUw8/xhriu3BvPv+MbwHzuHWkCxXlDIuyVsoDl5Kkp9IOiT7JK/J5pLkHckLkh7JAdmcYnlBAdZ9DFpfj0iaZDUrjDFlITyQya6klxzSyzMgHq8w5ybMFoVJ9B1rZLTpha5p3zj6h2mTXshGxXIW65OR0ssohb4yXkQvMYNGzjKVTrNCP0ZzaEfU5zlhK/rCglKlXtJkZdslTyul484pBDEUHfYzpR8a3l+jNLWAjG4tCzKN1YJynVj/KQssZBnlCwuodVjLU7zKbQJ5ZFOMnqPGasv9njc99pvRE0rISPn/lvzLtySGwjnqrqxfMB/WOf4tOpTFSne2AIA7ugCgndVe4a2CB7xV2rhgu7oB7ShwQJs1DlC7zAFsVTpg7xQ7em3WO7Jqljwu1ap6XKpe+OGk9wY=",
        },
    ],
});
