import { Bearing, Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

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
        for (const [v, bearing] of [
            [Vector.NE, puzzle.lattice.bearings().find(bearing => bearing.from(p).eq(Vector.E))],
            [Vector.SW, puzzle.lattice.bearings().find(bearing => bearing.from(p).eq(Vector.S))],
        ] as [Vector, Bearing][]) {
            lineTotals.push([
                puzzle.edgeTexts.get([p, v]),
                puzzle.points.lineFrom(bearing.next(p), bearing, p => !puzzle.symbols.has(p)),
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
        //     answer: "",
        // },
    ],
});
