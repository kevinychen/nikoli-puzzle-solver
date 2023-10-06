import { init } from "z3-solver";
import { fromPenpaUrl, newSolution, toPenpaUrl, toPuzzle } from "./internal/penpa";
import { ConstraintsImpl, PuzzleSolver, ValueMap } from "./lib";

interface PenpaEditWindow {
    pu: any;
    load: (url: string) => void;
}

declare global {
    var initPromise: ReturnType<typeof init>;
    var refs: any[];
    var solverRegistry: PuzzleSolver[];
    var exp: () => string;
    var imp: (url: string) => void;
    var penpaEditWindow: PenpaEditWindow & WindowProxy;
    var solve: (
        puzzleName: string,
        url: string,
        parameters: string,
        differentFrom: ValueMap<any, number>
    ) => Promise<[string, ValueMap<any, number>]>;
    var initSolverUI: () => void;
}

global.initPromise = init();
global.refs = [];

// Dynamically load all solvers
global.solverRegistry = [];
const requireContext = require.context("./solvers", false, /.*\.ts/);
requireContext.keys().forEach(requireContext);
solverRegistry.sort((a, b) => a.name.localeCompare(b.name));
console.log(`Loaded ${solverRegistry.length} solvers`);

global.solve = async (puzzleName: string, url: string, parameters: string, differentFrom: ValueMap<any, number>) => {
    const penpa = fromPenpaUrl(url, parameters);
    const z3 = await initPromise;
    const z3Context = z3.Context("main");
    const _Sum = z3Context.Sum;
    const context = Object.assign(z3Context, {
        Sum: (...args: any) => _Sum(cs.int(0, 0), ...args),
    });
    const solution = newSolution();
    let newValues: ValueMap<any, number> = undefined;
    const cs = new ConstraintsImpl(differentFrom, context, new context.Solver(), values => (newValues = values));
    return solverRegistry
        .find(({ name }) => name === puzzleName)
        .solve(context, toPuzzle(penpa), cs, solution)
        .finally(() => {
            // z3 lib calls del_context in the finalizer, but we want to free memory immediately.
            // HACKHACK: del_context isn't idempotent, so we keep a reference to the context so the
            // finalizer doesn't call del_context, which is a memory leak but a tiny one.
            refs.push(z3Context);
            z3.Z3.del_context(z3Context.ptr);
            z3.Z3.dec_ref = () => {};
        })
        .then(() => [toPenpaUrl(penpa, solution), newValues]);
};

global.initSolverUI = async function () {
    // Export and import a Penpa URL, starting from the "m=edit&p=".
    // These are global variables so that they can be easily used for debugging.
    global.exp = () => penpaEditWindow.pu.maketext().split("#")[1];
    global.imp = (url: string) => penpaEditWindow.load(url);

    global.penpaEditWindow = (document.getElementById("iframe") as any).contentWindow;

    const sampleSelect = document.getElementById("sample") as HTMLSelectElement;
    const typeSelect = document.getElementById("type") as HTMLSelectElement;
    const parametersTextarea = document.getElementById("parameters") as HTMLTextAreaElement;
    const solveButton = document.getElementById("solve") as HTMLButtonElement;

    let prevFoundUrl: string = undefined;
    let prevFoundValues: ValueMap<any, number> = undefined;

    for (const { name, samples } of solverRegistry) {
        typeSelect.add(
            Object.assign(document.createElement("option"), {
                text: name,
                value: name,
            })
        );
        for (const { name: sampleName } of samples) {
            sampleSelect.add(
                Object.assign(document.createElement("option"), {
                    text: sampleName || name,
                    value: sampleName || name,
                })
            );
        }
    }

    sampleSelect.addEventListener("change", () => {
        const {
            name,
            parameters,
            sample: { puzzle, parameters: sampleParameters },
        } = solverRegistry
            .flatMap(({ name, parameters, samples }) => samples.map(sample => ({ name, parameters, sample })))
            .find(({ name, sample }) => (sample.name || name) === sampleSelect.value);
        imp(puzzle);
        typeSelect.value = name;
        sampleSelect.value = "";
        parametersTextarea.value = sampleParameters || parameters;
        parametersTextarea.style.display = parameters ? "block" : "none";
    });

    typeSelect.addEventListener("change", () => {
        const { parameters } = solverRegistry.find(({ name }) => name === typeSelect.value);
        parametersTextarea.value = parameters;
        parametersTextarea.style.display = parameters ? "block" : "none";
    });

    solveButton.addEventListener("click", () => {
        if (!typeSelect.value) {
            alert("Choose a puzzle type to solve as.");
            return;
        }
        solveButton.textContent = "Solving...";
        solveButton.disabled = true;

        const url = exp();
        if (url !== prevFoundUrl) {
            prevFoundValues = undefined;
        }

        setTimeout(() => {
            solve(typeSelect.value, url, parametersTextarea.value, prevFoundValues)
                .then(([url, values]) => {
                    console.log("Solved:", url);
                    penpaEditWindow.load(url);
                    prevFoundUrl = exp();
                    prevFoundValues = values;
                })
                .catch((e: Error) => {
                    console.log(e);
                    alert(e.message);
                })
                .finally(() => {
                    solveButton.textContent = exp() === prevFoundUrl ? "Find another solution" : "Solve";
                    solveButton.disabled = false;
                });
        }, 0);
    });

    penpaEditWindow.document.addEventListener("click", () => penpaEditWindow.focus());

    setInterval(() => {
        if (solveButton.textContent !== "Solving..." && exp() !== prevFoundUrl) {
            prevFoundValues = undefined;
            prevFoundUrl = undefined;
            solveButton.textContent = "Solve";
        }
    }, 1000);
};
