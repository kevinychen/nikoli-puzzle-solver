import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a star into some of the cells.
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Stars cannot be horizontally, vertically or diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
        }
    }

    // The number at the top of the grid indicates how many stars are in each row, column and outlined region
    const numStars = parseInt(puzzle.parameters["stars"]);
    for (const [line] of puzzle.points.lines()) {
        cs.add(Sum(...line.map(p => grid.get(p))).eq(numStars));
    }
    for (const region of puzzle.regions()) {
        cs.add(Sum(...region.map(p => grid.get(p))).eq(numStars));
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.symbols.set(p, Symbol.STAR);
        }
    }
};

solverRegistry.push({
    name: "Star Battle",
    parameters: "stars: 2",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7Vbfb9s2EH73X1HomQ8ij/r51nXJXrJsXTIUhWAEcqI2RuWok+11UJD/vR9pfrJle9jTtg4YbNH3ncm77+54FNe/beu+UTp2X8kVfvGxOvePyVP/xOFzu9y0TflKvd5uHrseglI/XV6qD3W7bmZVmDWfPQ9FObxVww9lFelIRQaPjuZqeFs+Dz+Ww4UabvBXpDR0V7tJBuJFEJ36nZ/gtG92Wh1Dvg4yxPcQ75f9fdvcXe00P5fVcKsi5+g7v9qJ0ar7vYkCEYfvu9Vi6RSLeoNo1o/Lz+Gf9fah+7QNc/X8RQ2vd3xvzvCVPV8n7ug66QxdF8XfTLeYv7wg77+A8F1ZOe6/7sV8L96Uzxiv/aj9+N6Pl340frzFVDWIH7/3Y+zHxI9Xfs5F+RwZrVErE5VGo8baAAiBAFgCC5AQJAApAbaXzggygJwAm08XBIUyJg7AxACaAAyEpgWmLddYrElJJwWdjH4y+ClooNBK4mAAghI6haBEggEISmwwAEFJSgMuB4YMDBgIGQgYJGSQgEFKBikY5DSQw0BBAwUYxGQQg4EhAwMGQgYCBkkwAAEgVAECANfAqSShChAAGGkCP0moAgQAmk6c6VAFCACkk4BOGqoA4SAHLmzDmhrU1LJYFsWynGYRKRlAQEKYqhTVHgGIQnGQN4bgsmMK+ingp2BGc0ybgJxrMjCYgIx0EOkeWOeHBgwqZ1k5A26G3Byw3PEunhG4NcKwxYVNpxbxMKMQAMZIsSajn8yxHkNAFWIWOEaBx/7J4DQnyJGQnAnBOS0x6xOjPqMB9JwwBAjYSJwGoiKcJvBjuUMs1ljuEAvT3P7IM3LNeArEUzCeAqZ5BEAA4ObDESCGuwpJFOZNkMQDADrcLh6Muxeny4FpAO43webbA3QjFAQwoMccABhaM6AjpIO3nrBpIYDBWEZXYOYaCTFMCAQAJgTngRl7IcWabCwWSj8CtAwUB6VnM3k/wo0kOEd57viTbwTWbb7xfHMtwzUp1mTkloHoBORckyO4mEmMkcQJ4KkMgTsEB/07f9y/8aP1Y+pfA5l7n/zDb5y/pFNhP7v7y/ST/Pd081kVXTx8bF5dd/2qbiPcqaJ1196tt/2H+h4XBH/lwh0AuqftatH0E1XbdZ/b5dN03vLjU9c3Z/9yygbuzsxfdP3DkfUvddtOFLtL5ES1u+pMVJse95gDXPd992WiWdWbx4ni4M4zsdQ8baYENvWUYv2pPvK22sf8Mov+iPxTCS6s8v+F9d+6sLoaxN/aIfKt0fHbt+vP9j7UZ9of2rNtHvQnnQ79SU87h6dtDe2Zzob2uLmhOu1vKE9aHLo/6XJn9bjRHavjXneuTtrduTrs+Go++wo=",
            answer: "m=edit&p=7Vbbbhs3EH3XVwT7zAfelnt5S1O7L27a1C6KQDAM2VZiIZI3XUlNsYb+PWeoPau9qEBfegMKWfScETlzZoZDcvvrflEvldHy53KF//h4k8evzUP86vZzs9qtl+Ur9Xq/e6pqCEr9cHmpPizW2+Vs3s66nb00Rdm8U8135TwxiUosvia5Vc278qX5vmwuVHONnxJloLs6TrIQL1pR1L/ECaJ9c9QaDfltK0N8D/FhVT+sl3dXR82P5by5UYk4+iauFjHZVL8tk5aI4Idqc78Sxf1ih2i2T6vP7S/b/WP1aZ/QxUE1r498r8/wdSe+rqPrztO1fz3d4vZwQN5/AuG7ci7cfz6J+Um8Ll8OwktGE8f3cbyMo43jDaaqxsXx2zjqOKZxvIpzLsqXxBqDWtmktAY1NhbAETgAT+ABUoIUIBBge5mMIAPICbD5TEFQKGt1C6wGMARg4GjawbTnGo81gXQC6GT0k8FPQQOFUU63BiAoR6cQlHOtAQjK+dYABOUCDUgOLBlYMHBk4MAgJYMUDAIZBDDIaSCHgYIGCjDQZKDBwJKBBQNHBg4M0tYABABLYAG4Bk5d6gk8ACNN4ScNBAGAplMxnRPkAKSTgk5oqwChlwMJ27KmFjX1LJZHsTyneURKBhCQEKYq5D0AolD08sYQJDu2oJ8CfgpmNHcjkHNNpkcgIx1EegJe/NCAReU8K2fBzRY94G0vng7IGsewnYRNpx7xpF08MJB2kWJNRj+ZsO5CQBU0C6xR4K5/MjjNCfJUjmcClFGzPlr3DKDnHEOAgI3EaSDqHKc5+PHcIR5rPHeID6ftjzwj14ynQDwF4ylgmkcABABuPhwBznJXIYmOeXPe9AHocLtE0O1enC490wDcb86mPYBudOxGJzeaMT1gac2CjiMd3HqOTQsBDLoySoGZay+nC3PtZZMzITgPbNcLAWuyrli+B4JsPm4KKX3o+3HcSA7nqOvO0aIHfN4/36RluCZgTUZuWToCOdfkCE4zidqOgOmSGLhDDnKxyXH/Jo4+jiFeA5ncJ7hx+tdEGF4Qo4vmeIlc89JJJOK5xT22W9TxRkTJxxo/0aR6rJHUjzRhrJEuG2mysaaYzJFjeagxeuLM6OksMzFu7CRaIw0xUk0zYKYpMH4SnwkT8iaMeHU3u5T0MJu741tv+En/e7rb2Ty5ePy4fPW2qjeLdYL3Z7Kt1nfbff1h8YDHVHyeqqh73m/ul/VAta6qz+vV83De6uNzVS/P/iTKJdydmX9f1Y8j618W6/VAsY0P7oHq+CwcqHb1aoAXdV19GWg2i93TQNF7Hw4sLZ93QwKyHQa2Py1G3janmA+z5PckfucOj3v3/+P+n3rcSw303/zE/xPn/7+LTty+VX2296E+0/7Qnm3zVj/pdOgnPS0Op20N7ZnOhnbc3FBN+xvKSYtD9wddLlbHjS6sxr0uribtLq76HT+/nX0F",
        },
        {
            name: "Star Battle (hex)",
            puzzle: "m=edit&p=7ZZRb9s2EMff/SkCPdOAKJKipLeuS/aSZeuSoSgMI1AStTFqR51sr4GCfPf+j+LJIu1hTyv6MBg+8Hei7o7HO4qPzbMw+OlUpELip9PU/aUy7k96+t2sduumOhNv9rvHtsNAiN8uLsTHer1tZot0OXvpy6p/J/pfqkUiE5Fk+MtkKfp31Uv/a9Wfi/4ajxIhobscJmUYnvshqd+7CaR9O2hlivGVH2P4AcP7VXe/bm4vB83v1aK/EQk5+sm9TcNk0/7dJD4Q4vt2c7cixXr11Dx75Xb/0H7e+2ly+Sr6N0Oo1ydCVYdQaThESqMTkdIC/rtIy+XrK7L9B2K9rRYU9p+HYXEYXlcvkFdOSic/OHnhZObkDaaKXjn5s5Opk8bJSzfnvHpJlJTCFDqpMikSlRUh5GnqQasIZO4hT2OwDDKGgg2YCFLJTssQTDGahgGlPFgbgeHYSsQWQG4G0ClMh+BNa4moR0ix7MM0Ap8QncJPAIX3ozMdQcnWFPxMwcqMDeSw5pfgwJZsIMM77EfBTwj8DkQI1udaZ1jPCC7q0Q9ynY8REPhc6xRRh8BJLCgHU9BcIRZOA8h4Tw3WEwAvW+E8yiXvnHvCgCem5HLRKMsp5JL9GEQQgOLYLHY7gMxnVFlkNAQf27ALHJvFsg8GCLgSLVIVgObFlbAWAFeI6wU1miYDnHjaYN5thUo0XG8DcMWjLCPghFDThsARyCwG9iNVBGNnKZieQp6Om4XsBCDZQE5HwBQUL8Gi4gMwbKBEDgLgJQwNOIVirGs4DaDknaOimILlotDGxsAGUG8R8JYYEwP3gtExcKMbFUHKHaxgegp5OW49FheAHc8dJDEAw+kt6Hybgh5PPhgIIOOiwBJCGBuQTqQpGD6eFA6uEAqueByDIQwFi2/Ie/cleeukdjJ3XxhLn6rv/DH713AWdO+ZS0v3ISMyITVGc10SazxQQua4G5Gco3cwx83AnAJK4jkU+CrN8W0kM5gNNaSFCowXAHhzeEuSgk371/DtnGvMcC9BwjkP56hibwKSrcjlbJGcP3xqzq7ablOvE9zIkm27vt3uu4/1Pe4Y7qqGuwR0T/vNXdMFqnXbfqErR6BcfXpqu+bkI1I2cHdi/l3bPUTWv9brdaDY/rWvu/Dl4bYUqHYdrkITrruu/RpoNvXuMVDc1TtcVLePqy+hpeZpFwawq8MQ68915G1zWPPrLHlO3H+hcBlW/193v+91lzKf/mjnxI8WjivatjvZ8VCfaHpoTza31x/1N/RHnUwOj5sZ2hP9DG3c0lAddzWUR40N3T/0NlmN25uiijucXB01Obma9vliOfsG",
            parameters: "stars: 1",
            answer: "m=edit&p=7Zbfb9s2EMff/VcUfKYB/hQpvXVdspesW5cMQyEYgZKojVE76mR7DRT4f++R0sniyQP60mIPg2GCn6/I44m80/GxfuYWfkZwwSX8jBDxL7WNfzH8btb7TV284q8P+8emhQ7nv11e8g/VZlcvSrFavHR50b3j3S9FySTjTMFfshXv3hUv3a9Fd8G7a3jEuATtqh+koHsxdIP8VxwQ1De9KgX03w596L6H7v26vd/Ut1e98ntRdjechYV+irNDl22bf2o2OBL4vtnerYOwWT/Vz4O4Ozw0nw4MrR9597p39fqMq/rkqh491ec9Vd/V03x1PMJu/wG+3hZlcPvPU9efutfFyzG4FFoZ2/exvYytiu0NDOWdju3PsRWxtbG9imMuihempeTWG1YoyZlWPoVMiAGMJiCzATJBwSFICh4NWAJC4qJ5CtZnEwNaD+AcAYu+5ZpAZnswIqcwmDZSTED46bAABsER8MM6RhkCOVrTeQpOKjSQgTU9AZejAQVzcB3tKOAcaFJwDkFMIHo9rgN7nakpSARDATfRewIGI8RJAgrP1GYE8LW1CRGip0/06YnNMVyMTCGTuI71BDT65jQBlSMoCn56CuibM1MDATASnSVg8OVyRQAjJOaCVlMDuPHhgPG0NUSixXjrASMewpIAbkhI2hTQA6ko4DpSExgzS4sUMjEeVkZAooFME9D4Ci4nYNFAbgngK/QJOAU/xnVGIMeTC0ExBYdBYayjgAYg3gjgkVhLAXPBGgqY6FYTEJjBOkshy8ejFwTc+N3RBCxur3cEzPjlEwQUBgW8QgpjAoYv0hQsfp40fLhS8BjxwhPoA/YYymWoJG9ia2KbxQrjQqmCYjatQFlae0gN6+vTNdYzFmK1VFAi91Ub6yzznioylAoiKTWTtJtJZmZdhsQlkrczKSdOjLU27MRxUYar1VK6cOWyXHFpoLc0eWADDzSXGe/bJaQnjIkjYIzX/ZwlCFD4llB+gxkYLWPrQHJxAoCKc2CWDAKaHqZBeV4aNUyCNj91l0aiCXuyIleLkl08fKxfvW3abbVhcOlju2Zzuzu0H6p7uMbE2yCP2tNhe1e3ibRpms/hVpOI649PTVuffRTEGpY7M/6uaR+I9S/VZpMIu78PVZtO7i9kibRv1wlXbdt8SZRttX9MhLtqD3fh3eP6c2qpftqnDoSzT2x/qshq29M7HxfsmcV/qeG+rf+/Uf/YG3XYefGD79Xf8GX8b7kTg7Zpz2Y8yGeSHtSzyT3os/wGfZbJYcF5MoN6Jp9BpSkN0jyrQZwlNmj/ktvBKk3v4BXN8LDULMnDUtM8L1eLrw==",
        },
    ],
});
