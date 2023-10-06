import { Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ Distinct, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number between 1 and 9 into every empty cell
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 9));
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.symbols.has(p)));
    }

    // Find all horizontal or vertical runs of cells
    const lineTotals: [string, Point[]][] = [];
    for (const [p] of puzzle.symbols) {
        //  The number for a horizontal row going east is actually written on the northeast of the square
        for (const [textDir, v] of [
            [Vector.NE, Vector.E],
            [Vector.SW, Vector.S],
        ]) {
            lineTotals.push([
                puzzle.edgeTexts.get([p, textDir]),
                puzzle.points.sightLine(p.translate(v), v, p => !puzzle.symbols.has(p)),
            ]);
        }
    }
    for (const [total, line] of lineTotals) {
        if (line.length > 0) {
            // A clue on the bottom of a cell indicates the sum of numbers below the clue, up to the next clue
            // A clue on the right of a cell indicates the sum of numbers to the right of the clue, up to the next clue
            if (total !== undefined) {
                cs.add(Sum(...line.map(p => grid.get(p))).eq(parseInt(total)));
            }

            //  A digit may not be repeated in a horizontal or vertical run of cells
            cs.add(Distinct(...line.map(p => grid.get(p))));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value) {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Kakuro",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVNb9swDL3nVxQ66+DvJL51XbtLl61Lh6IwjEJJ3SaIE3WKvQ4O8t9LUt5sydqlWLEdBsME+USLj7Yftf9WC1XwBK5wwj3uwxUkCd1+FNHttdf1uiqL9ISf1tVKKnA4/3RxwR9EuS9GWZuVjw7NNG2uePMhzZjPOAvg9lnOm6v00HxMmxlv5rDEuA/YpU4KwD3v3BtaR+9Mg74H/gz8kPEI3FtwN2JTK6m3+ZxmzTVnWOUdPYsu28rvBWtZYLyU28UagYWooJX9av3Uruzre7mpcQnY+vmRN6ea7NxBNuzIoqvJomeTbbtBssu1WpbF3eWfpgu50/x4hJf+BQjfpRly/9q5k86dpwewM7J+emDRNKKGoWN4pRBOaENPh7GXUBi1IeD91cg3wmSK4aSNJrT4KwqoTLtR4lFqoD8kSwIq8zOKx7QtdEXhNOyqAOtbYA100yzg/a+Pm6WZb2HYnI3Fjmexvp2HLCwsdNQNcT8rL8I8G3PkxY682MElcdRNsF8bc/Q7djw7dryrMfZr5MHLvqAfJSB7DX8Qb0Ky78l6ZGOyl5RzTvaG7BnZiGxCOWP8B1/xl+qv/kZ0siCggaev+PV+PsrYrN4uCnUyk2orStDpfCWeCgbjkO1lebev1YNYgrxpWoKCAdvREwZUSvlUrndm3vpxJ1XhXEKwuH905S+kurd2fxZlaQB6+huQHlQGVCmYQr1YKCWfDWQrqpUB9CaWsVOxq0wClTApio2wqm27no8j9oPRnYVw1oT/z5q/ctbgB/Bec+L0DhHq++2U/Y8NGj0DpHKOAYAdkwBQp+JbfCB6wAfyxoJDhQPqEDmgts4BGkodwIHaAfuN4HFXW/PIypY9lhooH0v1xZ/loxc=",
            answer: "m=edit&p=7VVNb9swDL3nVxQ662Bbspz41nXtLl22Lh2KwggKJ3UbI07c+WMdHPi/l6LV2JK1w4oVuwyGBfKJIp8kkip/1HGRUAEfm1KHuvB5QuDvco6/o77rtMqS8ISe1tUmL0Cg9MvFBX2IszKZRMpqOTk0s7C5os2nMCIuocSD3yVL2lyFh+Zz2Mxps4ApQl3ALjsjD8TzXrzBeSmddaDrgDwHmRHKQbwFcRtv6yLv3HwNo+aaEhnlA66VItnlPxOiWEh9ne9WqQRWcQVbKTfpk5op6/t8W8spTzpsaXPakV1YyLKeLDuSZRayajeS7Dot1llyd/m36YLtbNm2cOjfgPBdGEnu33tx2ouL8NBKXnJ0wwPhM44b9vBIQZ2iQ6dTfUegypUK+HCWu5oqZlKdKm3qapqHYZQj4aCpx5TqYZhXzQ/QravUGeujtPIgD5JuGHl0ePvSWRi5BsYtmG9ZKyx2wRhjlrjMH9txz4JZ7HyLnW/hIixxBbNglv0GlrWB5ayCwLSDw77ARPFwvIYMog3D8SOODo4+jpdoc47jDY5nOHIcBdoEMgchS4c+xGg1JCdheOczKJ2ubRDGVaIfAWFaBIYFRx/+AOAqy46AMC0Cw8JnKomPAPoQA8A3eHTZy3tA+IYPIQymIlBN5xUIzN0G6CMYAEJb0lVz+3olXZXfDq5NXkk7iTwPm3v3+W+Xl5OIzOvdKilO5nmxizPoSYtN/JQQaP2kzLO7si4e4jW0MnwZKGJ7XKFBWZ4/Zelet0sf93mRWKckmNw/2uxXeXFveH+Os0wDSnzpNKhryhpUFammx0WRP2vILq42GjDozpqnZF/pBKpYpxhvYyPart9zOyG/CP4Rg3eV/X9X/8m7Ki/AecvrOngw3eWxIt+nqf4pufelg5mcF9Y2ALClEwBqrXiFj4oe8FF5y4DjCgfUUuSAmnUO0LjUARxVO2C/KXjp1ax5ycosexlqVPky1LD4o+XkBQ==",
        },
        // {
        //     puzzle: "m=edit&p=7Vffb9u2E3/PX0EIGNACSqzftvSWJc33YV2/3dKhKIygkGXGFiKLGUXFi4L87707io5Ns8UeVmwYBts078P78eGJR5/vyrteCj8M8Z2kfuDDzE+TgD5hGNEnGF8fatXwgv1ERuyVd8Xe81aJTd0K3nmv/fNerYUs2GX5UC/ZeaPqoRb+Wqn7rphMttvt2Wpz3w9Dw7uzSmwmi0asJlEQRZMgnmgqp4vH0yWan5ba/DSa+NeqbJelXJrIsgcPBXvTKi5Zybq6XTWcLetVrditFBsWMiVYzmogx3hZrdl2XSvOKt40rBNMrUsFA2ddv2HiVlt2oK6Vzyspuo7B1uQj47/3ZdOR9kPZ9Jyt6gfeon+EGn6r0APOSf+H6IIB2W94vxRbmH3Ld7kQD/zF5Rl7J8bNbcpHtuBM8nteKr5k21qtwe8uBdrtq/qMnyGRlRT9PVLAjXesEm3LK7SDp1QPolVl0zwyIdkDl6quSEKXolewCQjVlNXdaLzgast5+xocX8L7CqzKHp59CYaQ06ZXtWhZtebVHXDB6LiBtt8suOzYpu8UMgeCXAIBIL2S4A71FrBz/AaPsHTm///qyr+FvPCT+Xjwbk6ehrwYzv3hf8XcCz3fi+ATejf+8EvxNPxcDJ/84RqWPD8E7K1WimH6Rk8jmH6kdQQvtGYA03cwjT0/geknmOozqPXfF/Ph0vcwyI9kgFNvA4/GG0mgDMd4USOwKBUUR7eu78eVrl+Ku37UDW+e/eGcuJqFbzPG6VcZjztCxlUtq4Z/fvvC+cNfxTm/eX6GxP8KrD8Xc9zAby/T6+IJxnc0hsWTFwZJRHYZZRPkNEEZUCPPaH1q5Iz0Z0bMpyjGu+Wc1CNjHkYZmRv9MI1JzncyhYuAt5az/IBOmAcH61FA62Y5gkAgGm9RpK1TI8faereehPvkozGYIR/NUpJ3wWaafGJkvTmjHgfkLQyMrKNDzFHWqTJk4kx7M97jMVVGPdHuYkM2STQ7Ez3JNDvjL9H+Xuyn9CjM5lKdKeMthRTuR0915nbe01g/Z11VIOtU7Zb1MTGx0yk9xminnZNsMpPBecBlsoaT9glOWowOIn+/Vr0YrWwMD4SN4c5DC8Pd23oY1sZwX7YtpsbCEjwqNoY5sPxRImzMETfBuDbmiJviPmzM4Y8Ok41h/izbDG0tbIq2NubQmzlyMHPkYObwR7VjYblDL3fsN3fkJQwcZMLAwRouERfoiAMXxPFm4FZwabp80vmyQTo4tk86OUearkCpI0dh6opON7EdKHWlLnOljg6GbZ45qiOk4j4CXeZ0EI5AR1WHM9fec8fZCunQHIBwg1zRL1ZE4wf4KfOHmMZLGgMaUxrfks4bGj/SeEFjQmNGOlMaZ+Zn8es/lzuVo19Ofat9F2bPJ/MYGnjHK/33ojcnc++a2hhom+WmbKC1GeULIVsu92Rsl7kH3aUHDeznrpe3ZQWdEjWf0AwBpvtXr1CyH5FGiPumbg/V6lUrJHcuIciXK5f+QsglOt9b2EIPfgB08BcBOO5DuuU7gJSEfm5PLqUU2wME+vT1AbDX+x14gpwcElDlIcXyrrSiwf8/Q+f5xPvDow9UXpT54fS/3v1v693xMQR/toP/jvfQP/mG1KUvpLP6ATYXwCHqrPQRPyp2wI/KGgMeVzagjuIG1K5vgI5LHMCjKgfsK4WOXu1aR1Z2uWOoo4rHUPtFP785odkX",
        //     answer: "m=edit&p=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",
        // },
    ],
});
