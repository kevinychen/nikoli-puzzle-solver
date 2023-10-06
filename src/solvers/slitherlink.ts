import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines along the edges of some cells to form a loop
    const points = puzzle.points.expandToBorders();
    const grid = new ValueMap(points, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        if (!puzzle.points.has(p)) {
            cs.add(arith.eq(0));
        }
    }

    // The loop cannot branch off or cross itself
    for (const i of [0, 1]) {
        cs.addAllConnected(points, p => grid.get(p).eq(i));
    }

    // A number indicates the amount of edges surrounding the cell that are visited by the loop
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...points.edgeSharingPoints(p).map(q => grid.get(p).neq(grid.get(q)))).eq(parseInt(text)));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of points.edges()) {
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
            answer: "m=edit&p=7VRNj9owEL3zK1Y+++APAji37XbphdJuoVqtoggFyC7RBrJNQrcK4r93PDYkDqnUHvpxqExGj+fn8cTOm+LLPspj6sGQI8oohyHECJ8+07/TmCdlGvtX9HpfbrIcAKUfxmP6GKVF3AusKuwdKuVXd7R65wdEEko4PIKEtLrzD9V7v5rSagZThHLgJoBAIADe1vAe5zW6MSRngKcGS4APAFdJvkrjxcQk+ugH1ZwSvc8bXK0h2WZfY2KW4f9Vtl0mmlhGJbxMsUle7EyxX2fPe6vl4ZFW16bcWUe5si5XnsuV3eWK31+uCo9HOPZPUPDCD3Ttn2s4quHMPxx1XQcipF0q9f1APtHXhGgQqkVIRsyFngneIvqiTQxbu3iDNtHeZcAcBZTLsegHjGOMAuMc3olWEuNbjAyjh3GCmluM9xhvMPYxDlAz1KcC59bMMXBXEyWogrOCahSnSpwQZwwhZ4D5CYN5GLdYAG8xZ2esJFX9WsGkxRIUNnmfKs+gAQgs9KgaWKkHUpuCywZWlAtbCIfUwm4uWI21XgjLa41srB0ZLEEvT2tBL61e8hpDZ+ByaPkh4OZaZfHIYvPFnS/SXNKscanmIvUlHXuBMA1ID+/nUNgLyHS/Xcb51TTLt1FKoAWRIksXxT5/jFZgKOxQFLkdKh0qzbKXNNm5uuRpl+Vx55Qm4/VTl36Z5etW9tcoTR2iwH7rUKY1OFSZJ87/KM+zV4fZRuXGIRo9wskU70q3gDJyS4yeo9Zu2/qdjz3yjeATSOjv8n9//0v9XV8B+6Uu/0ea579VDn69Wd5pfaA73A9sp8stf2F04C8srTe8dDWwHcYGtu1toC7tDeSFw4H7gcl11rbPdVVtq+utLtyut2oaPgh73wE=",
        },
        {
            name: "Slitherlink (hex)",
            puzzle: "m=edit&p=7ZRPb9pAEMXvfIpoz4PkfxDwLU1DL5Q2hSqKLIQWcIIVm03XdhMZ8d0zMzYya7uHHhrlUBk/Hj/vn1mzb3fhK7h4eRZYYOPloKN74NGHKF2LKItD/wKu8mynNBqAb5MJPMg4DXuBtewdirFf3ELxxQ+EI6C6l1Dc+ofiq1/MoJjjIwE2sik6W4CD9qa2d/yc3HUJbQv9rPJo79FuIr2Jw9W0JN/9oFiAoHk+cW+yIlG/Q1F2498blawjAnG0D18rmOZb9ZRXzezlEYqrstJ5R6VuXSnZslJyHZXSAv5dpePl8Ygv+wfWuvIDKvtnbUe1nfsH1Jl/EK5HXQdYBuAAOJ7HAP+gExgMT6+hAkOXgHsGBk3AXbwTwKlsnvCedcLqsC6wHihc1s+sFuuAdcptbljvWK9ZPdYht7mkFf3Vmt+hnADD0bcpMiNwYIzffddBHUN/BLYNQ5L+Je4MQMEt0AvELE/Wob6YKZ3IWGBmRKriVZrrB7nBbcBhwr8b2Z5bGihW6pl2hQGjx73SYecjguH2sav9WultY/QXGccGSH/lUpudyw1toEzjbj37LbVWLwZJZLYzwFpmeJSku+jZHCncZ2YBmTRLlE+yMVtSr/nYE6+C78DF48r9fyC964FEL976aBH9aOXwnlW6M/CIOzKPtDPbFW/FG3kryDRhO8tIO+KMtJloRO1QI2zlGtkfok2jNtNNVTUDTlO1Mk5Tncc8WPbeAA==",
            answer: "m=edit&p=7ZVNb5tAEIbv/hXRntcS7Ack3NI06SV1mzpVFCErwg6JUbBJMW4iLP/3zgxLlsX00EOjHirM+PHLzO7Lame9TF+5hEt53OM+XAIIb63w45nrOqvyNDrip9tqWZQAnH+5uOAPSb5JR7E3G+3qk6i+4vWnKGaCcXPPeH0V7erPUT3h9RQeMe6DdgnkMy4Azy3e0HOks0b0PeCJYcBbwEVWLvL07rJRvkZxfc0ZzvOBqhHZqviZsqaMfi+K1TxDIc/W6asRN9v74mnL2tH3vD5tnE4HnErrVL45lcNOxV91ejLb72Gxv4HXuyhG298tHlucRrs9WtoxqbBUgw0OA8B4igRhBR20y2CEQKIgO4LuC1SiWgGm8mnCW4oXFAXFa/DDa0nxI0WPoqZ4STnnFG8onlFUFAPKCfGN4J27YwRuNfOV5kKDSwl+dJ+DhqXiQmrLyjDWtiwl5ChTC6xbhvxAW9adnMBwoDqsbb7Qdl5k0bJyuZ2XPEjDwmVlWPVYC+Onx4HJCaRlHdg1QQ5Ck9Nl8BMqWxua2rDPnfcNtR0nNOOHHZ0Y9WZnvm2aZkNMOxuo2TS4IfajGJZ77OPhdMwFP4HvMSyEDzQ+5r7PAwzjEHqQh3iCzUYxm2xX87Q8mhTlKskZnE5sU+R3m235kCyg4ejY4qStKdOR8qJ4xv5zxOxxXZTp4CMU0/vHofx5Ud73Rn9J8twRNj+2SekWN0eHI1Vl5vxOyrJ4cZRVUi0dYZ5UcGhvltmzO1K6rlwDVeJaTJ6S3mwr+877EXtldMcS/hjk/6P/XY9+XHjvj/4A3uVs/rfs0J4tysGGB3mg50Ed7G2jH7Q36AeNjBMe9jKoA+0Mar+jQTpsahAP+hq037Q2jtrvbnTVb3Cc6qDHcapum8ez0S8=",
        },
        {
            name: "Slitherlink (triangular)",
            puzzle: "m=edit&p=7ZRRb5s+FMXf8ykqP3uTjQNNeOu6Zi9Zti6ZqgqhyElogwpxZ2CtiPLde+8l/2UG9rCHVX34C3Fz+HFtHwjHpU25D0cguOASDgVKyfH7kTgPPCmVr5T0h1wOmxPb8FikZZaEZ/yiKrfGguD8y2TC73RWJINIxIN9PQ7ra15/CiPmMc4knB6LeX0d7uvPYT3j9RxuMS6BTUFBgwfy6iRv6D6qywZKAXp21CBvQa5Tu86S5bQhX8OoXnCG63yg0ShZbn4mrBlG12uTr1IEWbpLno+wqDbmoTq2yfjA64vG6bzHqTo5Rdk4RdXjFB/g3zkdx4cDvOxv4HUZRmj7+0mOTnIe7qHOwj2DvxHHwp8i8W+BCWUQ/PfcR+Kpdo/nqzYJusTvEHdmsCDJyC3VCVWP6gJ88lpR/UhVUPWpTqnniuoN1UuqQ6oB9Zzjk/7Vu3gFO5H0IDlS8HdSYL5QSrzwKG5SjOgXgGrAL0QQxjZHPIjYrMpXiT2bGZvrjEHGWGGyZVHZO72Gz4bCB58HsB11Oigz5hG/Igem9ztjk95bCJPNfV//ythNa/YnnWUOKH5U2rqDmwA4CLYf51pba54ckuty64CVLmHrKbbpoztTsitdA6V2LeoH3VotPz3zYcCeGZ2Rgu1N/b+BveoGhi9evLXovjU79M0a2xt4wD2ZB9qb7SPvxBt4J8i4YDfLQHviDLSdaEDdUAPs5BrYH6KNs7bTja7aAcelOhnHpX6PeRQPXgA=",
            answer: "m=edit&p=7ZRNb5tAEIbv/hXRnqcVuwtLzC1N415St6ldRRGyImyTBAWbdI2bCMv/vbOzYGeBHnpo1EOFGF6e/Zr9eLfUGQT4KA884PhIVJIP3596oRKcy0BKHvjAfft69TPNyjyNTuBsWz4UGgXAl9EI7pJ8kw5ibzbYVcOouoLqUxQzwYBxfAWbQXUV7arPUTWGaoJFDDiyS1RYQaC8OMprKjfq3ELuoR7XGuUNykWmF3l6e2nJ1yiupsDMOB+otZFsVfxMmW1G/4tiNc8MyLN1+lLDzXZZPG5Z0/seqjOb6aQnU3nMVB4ylf2Zir+a6XC23+Nif8Ncb6PYpP39KE+PchLt9ialHcNtZHZTuNkW7JAr1cy7JkK264hAtonqkqBD3J4xBU6J3FAcURQUp5gnVJLiR4oexYDiJdW5oHhN8ZyiT1FRndDMFNfidR/Kbc2kBDM1CUb5tfLBD0jhAQ8sC+RBCTBTN6VolKBhyjLlg7JMHViAdlINC0VTL7SloWiUCiC0YygFoe0l9K2ye3VYLrsUk1dLZ5fLLMV+EHOB7uQevOOe8bCR3PwIsjT3TumLQFpwQAT9Bs4GMRtvV/NUn4wLvUpyhj5mmyK/3Wz1XbLAo0kGB2JrqumgvCiezEl1YHa/LnTaW2Rgurzvqz8v9LLV+3OS5w7Y/Ngm2m1sTeagUmfOf6J18eyQVVI+OGCelHi9bR6yJ7endF26CZSJm2LymLRGWx3nvB+wF0ZvLPEKlf8vyTe9JM3Ce390Vb7JbfVvpUNnttC9hkfc43mkvd6uecfeyDtGNgN2vYy0x85I245G1DU1wo6vkf3G2qbXtrtNVm2Dm6E6HjdDvbZ5PBv8Ag==",
        },
    ],
});
