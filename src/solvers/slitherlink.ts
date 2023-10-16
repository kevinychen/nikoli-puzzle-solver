import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines along the edges of some cells to form a loop
    const expandedPoints = new PointSet(
        puzzle.lattice,
        [...puzzle.points].flatMap(p => puzzle.lattice.vertexSharingPoints(p))
    );
    const grid = new ValueMap(expandedPoints, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        if (!puzzle.points.has(p)) {
            cs.add(arith.eq(0));
        }
    }

    // The loop cannot branch off or cross itself
    for (const i of [0, 1]) {
        cs.addAllConnected(expandedPoints, p => grid.get(p).eq(i));
    }

    // A number indicates the amount of edges surrounding the cell that are visited by the loop
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...expandedPoints.edgeSharingPoints(p).map(q => grid.get(p).neq(grid.get(q)))).eq(parseInt(text)));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of expandedPoints.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Slitherlink",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTBb9owFMbv/BWVzz4kDlDIretKL4ytg6mqoggZSEvUBHdOsk5G/O997yUr2Mmk7bCth8nk6fHzi9+XxJ+Lr5XUCR/ACEbc4z4MIUZ09T38/RiLtMyS8IxfVOVWaUg4/ziZ8HuZFUkvaqri3t6MQ3PDzXUYsYBx5sMlWMzNTbg3H0Iz42YOU4z7wKaQQYGA9OqY3tI8Zpc19D3IZ3UeQHoH6TrV6yxZTuuFPoWRWXCGfd7R3ZiyXH1LWH0b/V+rfJUiWMkSHqbYpk/NTFFt1GPV1PrxgZuLWu68Qy5KaORiWsvFrEMuPsUfljuODwd47Z9B8DKMUPuXYzo6pvNwD3EW7pkImlsD/D6wnugjECdg7IDAQwAf9BX4DugLF5w7XQZDF7hdhtTltQLk+iT6juKEoqC4gGfiJqD4nqJHcUBxSjVXFG8pXlLsUxxSzTm+ld96b39BTiRqC+IY/FoW9yI2q/JVos9mSucyY2BCVqhsWVT6Xq5hS5FHYdcA21GlhTKlnrJ0Z9elDzulk84phMnmoat+pfTGWf1ZZpkF6hPHQrU5LFRq2Pkn/6XW6tkiuSy3FjhxibVSsittAaW0JcpH6XTLj8986LHvjK4ogBMu+H/C/aMTDj+B99b8+tbk0O5VutP6gDvcD7TT5Q1vGR14y9LYsO1qoB3GBup6G1Db3gBbDgf2E5Pjqq7PUZVrdWzVcju2OjV8FPdeAA==",
            answer: "m=edit&p=7VTLjpswFN3zFSOvvfADSMxuOp10k6adJtVohKKIJMwEDQlTIJ2KiH/v9SMBA5XaRR+LyuHq5Pj6+hhzbvHlGOUx9mDwMSaYwmBsrB6XyN95LJIyjYMrfH0sd1kOAOMPkwl+jNIidkKTtXROlQiqO1y9C0LEEUYUHoaWuLoLTtX7oJrhag5TCFPgpoAggQG8beC9mpfoRpOUAJ5pzAE+ANwk+SaNV1Nd6GMQVguM5D5v1GoJ0T77GiO9TP3fZPt1Iol1VMJhil3yYmaK4zZ7Pppcuqxxda3lzgfk8kYuv8jlw3LZ75crlnUNr/0TCF4FodT+uYHjBs6DUy11nRDjZimX9wP1mCsJ1iJEh+AE6Qu9ELRDuKxLjDq7eH6X6O7iEysD5FIl+kHFiYpMxQWcCVdcxbcqEhU9Facq51bFexVvVHRV9FXOSL4VeG/tGr69GlECfqAgSuqh4A5KNSashYEnGgtIJ+QMBdOIYcGbZeSMOZQwGRwLVyMXC89sJ+ddk+tdsPCw8DXyodg5WWDKjE4GepjRRlkLQ0HGTI7keWvtWGMOa7nJ53AYfs7nLTwGPDI5I8DntZIXrToS6y/ucpH6kuatS9UXKS+pdkKmG5Ac3s+hpROi2XG/jvOrWZbvoxRBC0JFlq6KY/4YbcBQqkNhxR1UpkWlWfaSJgc7L3k6ZHk8OCXJePs0lL/O8m2n+muUphZRqH5rUbo1WFSZJ9b/KM+zV4vZR+XOIlo9wqoUH0pbQBnZEqPnqLPbvjlz7aBvSD0hh/7O//f3v9Tf5RWQX+ryf6R5/lty1Neb5YPWB3rA/cAOutzwPaMD37O03LDvamAHjA1s19tA9e0NZM/hwP3A5LJq1+dSVdfqcque2+VWbcOHS+c7",
        },
        {
            name: "Slitherlink (hex)",
            puzzle: "m=edit&p=7ZRPb9pAEMXvfIpoz4PkfxDwLU1DL5Q2hSqKLIQWcIIVm03XdhMZ8d0zMzYya7uHHhrlUBk/Hj/vn1mzb3fhK7h4eRZYYOPloKN74NGHKF2LKItD/wKu8mynNBqAb5MJPMg4DXuBtewdirFf3ELxxQ+EI6C6l1Dc+ofiq1/MoJjjIwE2sik6W4CD9qa2d/yc3HUJbQv9rPJo79FuIr2Jw9W0JN/9oFiAoHk+cW+yIlG/Q1F2498blawjAnG0D18rmOZb9ZRXzezlEYqrstJ5R6VuXSnZslJyHZXSAv5dpePl8Ygv+wfWuvIDKvtnbUe1nfsH1Jl/EK5HXQdYBuAAOJ7HAP+gExgMT6+hAkOXgHsGBk3AXbwTwKlsnvCedcLqsC6wHihc1s+sFuuAdcptbljvWK9ZPdYht7mkFf3Vmt+hnADD0bcpMiNwYIzffddBHUN/BLYNQ5L+Je4MQMEt0AvELE/Wob6YKZ3IWGBmRKriVZrrB7nBbcBhwr8b2Z5bGihW6pl2hQGjx73SYecjguH2sav9WultY/QXGccGSH/lUpudyw1toEzjbj37LbVWLwZJZLYzwFpmeJSku+jZHCncZ2YBmTRLlE+yMVtSr/nYE6+C78DF48r9fyC964FEL976aBH9aOXwnlW6M/CIOzKPtDPbFW/FG3kryDRhO8tIO+KMtJloRO1QI2zlGtkfok2jNtNNVTUDTlO1Mk5Tncc8WPbeAA==",
            answer: "m=edit&p=7VVNb9pAEL3zK6I9L5K9Xwbf0jTpJaVNoYoiC0WGOMGKwakxTWTEf+/MemG9tnvooVEPlePJ43ln5nnZN6ySN8rhEh71qA8XA4S3FPjnmWuWllkSntHzXbnKCwCUfrm6oo9xtk0GkTcf7KtxWN3Q6lMYEUaouee0ugn31eewmtBqCo8I9YG7BuQTygBeWnirnyO6qEnfAzwxGOAdwGVaLLPk/rpmvoZRNaME+3zQ2QjJOv+ZkDpNf17m60WKRJZukjdDbncP+fOOHKsfaHVeK532KOVWKT8p5f1K2V9VOp4fDrDZ30DrfRih7O8WjiychvsDStoTLjBVggwKBaCe0ASzhFTHbTCE4kjwBiHbhE4RRwJa+brhnY5XOjIdZ6CHVlzHjzp6Okodr/WaSx1vdbzQUeio9JoA3wjeuVlDudnEl5IyCSo56IFzy5TBSlqMvBQGcxcrg5WwmAPPjxh4IS3mBgtpedHUgFg16nCDmYuFwUzYXgxymbT8CUvbV0KuMrmKWywaNRFLZtefsLLaFGAVWP6IcR8CYfcwkLZXYOoHbWzWB431Gjd6aVyfzNOhqQ/EtHGA6kODB+IwiOBrG/o4nEaU0TH8H8LG+YCGI+r7VGEYBuBBGuAEmw8iMtmtF0lxNsmLdZwRmE5km2f3213xGC/BcHpsUc1t9EqHyvL8Bf3nkOnTJi+S3kdIJg9PfesXefHQqv4aZ5lDbH/s4sJNrkeHQ5VF6nyOiyJ/dZh1XK4cYhGXMLS3q/TFrZRsSldAGbsS4+e41W1t3/kwIG9E3xGHHwb+f/S/6+jHjff+6AfgXWbzvyVHn9m86DU80D2eB7bX24bv2Bv4jpGxYdfLwPbYGdi2o4HqmhrIjq+B+421sWrb3aiqbXBs1fE4tmraPJoPfgE=",
        },
        {
            name: "Slitherlink (triangular)",
            puzzle: "m=edit&p=7ZRRb5s+FMXf8ykqP3uTjQNNeOu6Zi9Zti6ZqgqhyElogwpxZ2CtiPLde+8l/2UG9rCHVX34C3Fz+HFtHwjHpU25D0cguOASDgVKyfH7kTgPPCmVr5T0h1wOmxPb8FikZZaEZ/yiKrfGguD8y2TC73RWJINIxIN9PQ7ra15/CiPmMc4knB6LeX0d7uvPYT3j9RxuMS6BTUFBgwfy6iRv6D6qywZKAXp21CBvQa5Tu86S5bQhX8OoXnCG63yg0ShZbn4mrBlG12uTr1IEWbpLno+wqDbmoTq2yfjA64vG6bzHqTo5Rdk4RdXjFB/g3zkdx4cDvOxv4HUZRmj7+0mOTnIe7qHOwj2DvxHHwp8i8W+BCWUQ/PfcR+Kpdo/nqzYJusTvEHdmsCDJyC3VCVWP6gJ88lpR/UhVUPWpTqnniuoN1UuqQ6oB9Zzjk/7Vu3gFO5H0IDlS8HdSYL5QSrzwKG5SjOgXgGrAL0QQxjZHPIjYrMpXiT2bGZvrjEHGWGGyZVHZO72Gz4bCB58HsB11Oigz5hG/Igem9ztjk95bCJPNfV//ythNa/YnnWUOKH5U2rqDmwA4CLYf51pba54ckuty64CVLmHrKbbpoztTsitdA6V2LeoH3VotPz3zYcCeGZ2Rgu1N/b+BveoGhi9evLXovjU79M0a2xt4wD2ZB9qb7SPvxBt4J8i4YDfLQHviDLSdaEDdUAPs5BrYH6KNs7bTja7aAcelOhnHpX6PeRQPXgA=",
            answer: "m=edit&p=7ZRNb5tAEIbv/hXRnqcVuwtLzC1N415ct6ldRRGyLGyTGAWbdI2bCMv/vbOz/lqghx4a9VAhhpdnv2YH3i11BgFeygMPOF4SleTd95deqATnMpCSBz5w397e/hplZZ5GF3C1KReFRgHwpdeDhyRfp53YG3e2VTeqbqH6FMVMMGAcb8HGUN1G2+pzVA2gGmITA46sjwo7CJQ3J3lH7UZdW8g91IO9RnmPcpbpWZ5O+pZ8jeJqBMys84FGG8mWxc+U2WH0PiuW08yAPFulr3u43syLpw07zL6D6spmOmzJVJ4ylcdMZXum4q9m2h3vdljsb5jrJIpN2t9P8vIkh9F2Z1LaMvyMzH4Ubj4LTsiVOux7T4Ss9xGBrBPVJEGDuDNjCpwSuafYoygojjBPqCTFjxQ9igHFPvW5oXhH8ZqiT1FRn9DsFGtxPodyRzPpg49JSmBSgimEVdIq/MEDqwJ5VALM1k0rGiU4MGWZ8kFZpo4sQDupQ2toWSgOCvuFwqoAQruGUhDaWULfKvutjuWypRielc6Wy5Ri14m5QHdyD95xz3jYSG5eBFmae5f0RCAtOCKC/gGOOzEbbJbTVF8MCr1McoY+Zusin6w3+iGZ4a9JBgdiK+rpoLwons2f6sDscVXotLXJwHT+2NZ/Wuh5bfaXJM8dsP6xSbQ72JrMQaXOnPdE6+LFIcukXDhgmpR4vK0X2bM7U7oq3QTKxE0xeUpqqy1Pe9512CujO5Z4hMr/h+SbHpKm8N4fHZVvclr9W+nQP1voVsMjbvE80lZv73nD3sgbRjYLNr2MtMXOSOuORtQ0NcKGr5H9xtpm1rq7TVZ1g5ulGh43S53bPB53fgE=",
        },
    ],
});
