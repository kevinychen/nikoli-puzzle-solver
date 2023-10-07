import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into pentominoes (regions of 5 cells)
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Find all placements
    const placements = puzzle.points.placements(puzzle.lattice.polyominoes(5));
    const typeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        cs.add(
            Or(
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(...placement.map(p => And(grid.get(p).eq(instance), typeGrid.get(p).eq(type))))
                    )
            )
        );
    }

    // Two adjacent pentominoes cannot have the same shape, counting rotations and reflections as the same
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Implies(typeGrid.get(p).neq(typeGrid.get(q)), grid.get(p).neq(grid.get(q))));
    }

    // A letter indicates the shape of the pentomino it's contained in
    for (const [p, text] of puzzle.texts) {
        cs.add(Or(grid.get(p)?.eq("ILYNPUVTWFZX".indexOf(text)) || true));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Pentominous",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swGL3zV1Q++8CPpEu5dVmzS8bWJVPVIRQ5CW1QIe4MrJOj/O/9vs9UxMCk7bCth8nh6fH82X6O/Si/1UKlfAwtmHCXe9B8f0LPyMXfS1tmVZ6GZ/yyrnZSAeH842zG70Repk7cVCXOQV+E+prr92HMPMaZD4/HEq6vw4P+EOqI6wV0Me6BNjdFPtCrlt5QP7KpET0XeNRwoLdAN5na5OlqbpRPYayXnOE6b2k0UlbI7ylrfOD7RhbrDIW1qGAz5S57bHrKeisf6qbWS45cXxq7iwG7QWsXqbGLbMAu7uIP271Ijkf42z+D4VUYo/cvLZ20dBEeAKPwwHwXh6IXczbMH3WE8TkKX18EGOfR6FvCGaFPuITJuQ4I3xG6hGPCOdVcEd4QTglHhOdU8wbt/dYG/oKd2DdZwDb+NZY4MYvqYp2qs0iqQuQM0sBKma/KWt2JDZwthQWOD7Q9VVpSLuVjnu3tuux+L1U62IViur0fql9Lte3M/iTy3BJM9C3J3FJLqhRcwZN3oZR8spRCVDtLOLmu1kzpvrINVMK2KB5EZ7Wi3fPRYT8YPXEAn5rg/6fmH31q8Ajc15bX12aHbq9Ug9EHeSD9oA6mvNF7QQe9F2lcsJ9qUAeCDWo32yD14w1iL+Gg/STkOGs35+iqG3Vcqpd2XOo08HHiPAM=",
            answer: "m=edit&p=7VRNc5swEL3zKzI664Ak2zHc0jTuxXWb2p1Myng82CYxE7BSAU0HD/89u0I2FtCZ9tCPQ0ew83jaXT0ET9nXIlQRHcIQY+pSBoPzsb4HLl7HsYjzJPIv6FWR76QCQOmHyYQ+hEkWOYHJWjqH0vPLW1q+8wPCCCUcbkaWtLz1D+V7v5zRcg5ThDLgpnUSB3jTwDs9j+i6JpkLeGYwwHuAm1htkmg1rZmPflAuKMF13uhqhCSV3yJidODzRqbrGIl1mMPLZLv42cxkxVY+FeS4REXLq1ruvEeuaOSKk1zRL5f/frnesqpg2z+B4JUfoPbPDRw3cO4fKtR1INzFUtRSfxvCBy1iOELiy5GAOqar73Wc6Mh1XEBzWgod3+ro6jjUcapzbnS80/Fax4GOI51zifLgBc57jOxq4gnYVU58AXJcdsLeAKAwNKYMmhTm1pjBT82Ywcgf20AtE2c5nsGcMm7yudtgBv25qeWswcwDPDb85RnGWtOTQ09h+gioFcc+UCswv/4wp22ut3B+tuX1NuMWVk7Aa5/iGP4cWjoBmRXpOlIXM6nSMCHgVJLJZJUV6iHcwH+njUw1t9eZFpVI+ZzEezsvftxLFfVOIRltH/vy11JtW91fwiSxiEwfSxZVO8iichVbz6FS8sVi0jDfWcSZlaxO0T63BeShLTF8Clurpc07Vw75TvQdCDgGxf9j8C8dg/gJ3F86DP/I0fZvydF/r1S91ge6x/3A9rrc8B2jA9+xNC7YdTWwPcYGtu1toLr2BrLjcOB+YHLs2vY5qmpbHZfquB2XOjd8sHReAQ==",
        },
        // {
        //     puzzle: "m=edit&p=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",
        //     answer: "m=edit&p=7Vpdb9tWEn3PryAEFEgBJibvFy/95qbJootsNls7m80aQUBLtK2GFr0kFTcO/N/3zOVcXkq63gJ92L4UqaXj8XDmnLkzI0pq/59t1dWpyNI8S5VO8Yx/JZAq6Sd3Pxn/O1sPTX2cvK03Q3uz3rTbPnm6+GmTnG1/XXyfnmyH67Y7Tv7aXm+SH7bNUG/S62G47Y+Pju7u7p5f3dxu7++bun++bG+OLpr26khkQhzl2dFtiPjs4uuzXxDh2YWL8EwfpadDtVlV3Won8c9bRDpOflx/Wa/qZLiuk6tuvUrW8EimcDUIXq6/1M+WddMkXX21bjf990nf4oJqSDZ4vtt1by9drL66wcN1dVsnT9ebZbNdrTdXSdcO1UAhjrr6sqmXA4e7Rg2TapPUq6v6eXKSuGx36+E6qZKmHoa6A69kPSQ3235ILurktuoGn2rKzvk2bXdTNc3XpOr7drmuhno1xnKUx3BIgnibL3Rp95UizTWs++QKojfI1LR3YxJX+eRiS6KHBPHHbP1EadvXq+ffiR/x36u2S6otwkHsEsVqtiQ0WV7Xy88ow3fiRVKDEFQ9PfnexQoaRn4hLP5QdzWdC86nrjd08UWzrekZaehPJ6fJi5O3P52dvE5evzw7e/nzKf3x6Q9jaKppn/Q1SgY6OITbtvnqlfosq6662+zkQOynL8YIdBp9Qke0bJuWMj6tNl+HawpW/7qsb4fk7no91KEv3Ok7Z6Sous9JD9+m3ikyWjKpVr9US9g4xUU93CF9slpfXkI07DsXUI80d9XXfuYwJnme/v3Vq/Syavr6yTkP28cn3+7L4/uT9P4vx+cLsUjdT774mN7/4/jb/d+O79+k96f40yLNYXsNlC9SCfgSUC9SAfje/Z2ML0bPDPDN6EpXfQDs3Qr4dDpe8fb4/P4sXVCaH9wlBBc37Zd6MV7mfscAX6zJcFENWAn99fqW/9JvV+3n7cKneEjvTxxbvsRTLg4pM/xflAVTXq67ZVN/ev27KLuG2l7E+JYfHx5Q9p/B+NPxOZF/F+Dp8bcHYvJtoRX5/wRu44EstCbDm2CwGRnOZoacDO9mBkGGfwVDLiVZ3s4t+3lyuZ8ol3YvcC7L/TiFs/xzZhn5zSOPBF/PLeLAxzF8Nbc4hh9mllLvX1Wa/chlsWcRB9rFqP3d3LKvXSgX+f3cUuxlF8ru51LlvkVneyqEzvdz6f1qCC0P4qgDi96LLIXgyAptM1ocw3/PLKOKt8FiRu3vZpbxTF8FS1l6ht6SZ7kvdDAJ35kzk+RWnExyPI/3c5MuuIlmJsvqRhOmI3cz8gEzIl0ike6uF9YfMcu4WcXNOm62UbOKx1bx2Coe2/VaxFzEzY8wKaNmHS+Va8IDs5FROWOLRMxRgkZGmRgTPR1joqUae/DQbONBbJy3jfO20XobG5VTmmi9yyJawbKIEiyLqMpxriLmR7yjBDGKUZmwR3Xy6Mbs0ZrzXMfs0arnUsTjyHh3wR7nL2Wc/yPNC/sj8XW0nLA/klc/ljdet3FXxeyROmCFvXKLTLjHM7z+p/fSPf7oHjP3qN3ja+fzEivPZCY1GfIjHJ6BLWMLXDIuU5NnI8ZbLpPnjHNgwVgAS8YSWDFWwJqxBkYNxAPdMhGFF+5ReSISSXKadCSh4hLWCFDYERc2LTLhMJ7TQpgRCwNcsF1OGMMOf8lxkJyG38UHcTqknEXLPOSdMHykYAxxkuNIiJPMTYKb5DgS8aVhjOJJnwvFU6wrNwEr5DIcxyCOZY0WGnPWiKIWHLNA/IAVsGYMvcynkOQvGefAHAe6CtZVCNSE61wI5BIl4wLYhtpy3Vw9M46fIW/GeTPwyZgPzq7IfP0RJ/Nx6Lw4PpqoyDkvmqjImQ+aKOjNJ13YmpOPMai5LUI9DZ8FNdRUZzpHrqGkXmJ/auT5OWo+Iw0fy2dhs12NIvTb1DPopbm/sczNok8sx7eIb5mbJc58vpbO1+sCZ8scrAm6oNf3gKuP7zH4+LrhpS5cSz1mOC8NmddOtZr6SoRamTz4G+o95q+pnhxfI6ZmvRp8tA210kWYo6mGapoj1w/cS1QT3ycujq8VzY72fWKmPqS6+V5yHHw9ab48B1o8via0kHyfU7/5mbVy6kOny58FzabXRUvL9xgtrWlmTagD1Wd2djv97GeK+tnvBKunPnd19mdNPenrTEvR9SQWnvXv0Oid23xJm731LBFZ0olL3FuhEyR1i8MFsGVsgcsRG/iUGdvLgA186KaAcJkHXGTAiu0y4IJ8NNvBoWQOJcVnDiU4lMyhIB/mUJhUZWNeleXAPlcJLNkuJiwxTSpTk0aV87X06R5tANaocsF2XJtzHFRV5WrSpXLNdjVhaAU2k0aVF+xTANtJlxI+bzlh6AP2dSM75xUi4Aw8hQp6BXMQFJNzYasoYdleBIxuVJL90e0Ba2ATNEqOg45Skq/FBlCyZB/kUswfryxK5WyHj+K6qTxg0qiYvxIBC7pWBY2KOdCHqx4L8FTMQRUBC/JhPsoGTHXQnlsZMF59lBZBu7ZBu+ZrMZXKZEG7YV2Y0AnjFUEZGbQb5o9NOGHSbri2hmJyPRXyGs5rioBJr2EOmJ0JK1xbZEF7wRwwRxMm7QXrKlDDgrlp8mE+muxcT8zOhLH9lOVrsUUnjG2mrAzarddIPqwLu0LxrlA0R7wrUANg1oW9MWFD/mWoCe8K2AJ2H6YzB0N25kAz5TFp570xfgDvdaH+vCsUzZfHBfjw3nDaeW8omjWPsUM07xA8A3Nt8UqhM69RAnNMbGmdWfa3wOVUB+33CbTr3MeBj98n0Kv9PimRK1eTdu33CfRq3iHQDex1IS/vENKu8zEvbBMm7Zr3CZ6B80mv5t0CW8Ckl/eJFjJgvGJq6WsCLXKMg2dgfy20SMl2ETB2qZYcJyd/zZh8DGPk4j2DGgBzPXGXpXnPwBYwdo7mnYN6AOdBO+8ZPAMzB4X4vFvwDMwcBPkwB8zdhEm7Yj6K4jMf3M1qrYJ2zXFwNxIw4miOg7sOrTmOJB+OgzuTCUvy9xqhi3cO6gHMujB3ASOvYY3YP9p4jeTjNZKPDnUwzAdzFzDlKoJ23jOoQap5zzjtvFtgCxh7RvOe0QX52KC94DiFDRh3cdpyTLzmastxsHM07xnUAJi10HzxnnF6ec9omjWPcYeprddC/qyF5s5jQ/7MjeaOd47TXno+ZcDYw7pkbjSDvH9QG2DmRvM4YeTl/aNpHvm+BbUBZm40mxOmvJ4n7tYyrwt3g7xbSLvJvE8xvuVl/ob3BnFwb2fl+BH79FHi+E771H+sOL0bp7e8D0/O9fh95W//03/6/T/8Pj45X5xuu8tqWS/SxZvtzUXdJW/cF5r4/UV7c9v266FefHzybdG3zaeefY/dd1+ps23cVTumpm1vm/Vm1299tWm7OvonMtLXPBH/i7Zb7UW/q5pmxzB+FrRjGr9x2jEN3Xrn96rr2rsdy001XO8YZt+W7USqN8MugaHapVh9rvay3QTND08Wvy7cz7lIceNo/vzq8A/66pDOIPvtLxDnX5T8vs8aDz/0e/BveAv3uPOuOE7H/hHMHnjw2y46+zD78R+6bTBGp5zt46DvuB9MNKU7HGpYI3MN6/5ow3Q43TAeDDhsj8w4Rd0fc2K1P+mU6mDYKdV83s8Xs/9hBsvUmf8L",
        // },
    ],
});
