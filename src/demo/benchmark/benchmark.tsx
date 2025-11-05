import { For, type JSX, render } from "@kayahr/harmless";
import { type WritableSignal, arraySignal, atomic, signal } from "@kayahr/signal";

const adjectives = [
    "pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful",
    "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"
];
const colors = [ "red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange" ];
const nouns = [ "table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard" ];

const random = (max: number) => Math.round(Math.random() * 1000) % max;

let nextId = 1;

interface Data {
    id: number;
    label: WritableSignal<string>;
}

const buildData = (count: number) => {
    const data = Array.from<Data>({ length: count });
    for (let i = 0; i < count; i++) {
        const label = signal(
            `${adjectives[random(adjectives.length)]} ${colors[random(colors.length)]} ${nouns[random(nouns.length)]}`
        );
        data[i] = { id: nextId++, label };
    }
    return data;
};

const Button = ({ id, children, fn }: { id: string, children: JSX.Element, fn: () => void }) => (
    <div class="col-sm-6 smallpad">
        <button id={id} class="btn btn-primary btn-block" type="button" onclick={fn}>
            {children}
        </button>
    </div>
);

document.getElementById("main")?.appendChild(render(() => {
    const data = arraySignal<Data>([]);
    const selected = signal<number | null>(null);
    const run = () => data.set(buildData(1_000));
    const runLots = () => data.set(buildData(10_000));
    const add = () => data.push(...buildData(1_000));
    const update = () =>
        atomic(() => {
            for (let i = 0, d = data.get(), len = d.length; i < len; i += 10) {
                d[i]?.label.update(l => `${l} !!!`);
            }
        });
    const clear = () => data.set([]);
    const swapRows = () => {
        if (data.length > 998) {
            const item = data.at(1)!;
            atomic(() => {
                data.setAt(1, data.at(998)!);
                data.setAt(998, item);
            });
        }
    };

    return (
        <div class="container">
            <div class="jumbotron">
                <div class="row">
                    <div class="col-md-6">
                        <h1>Harmless</h1>
                    </div>
                    <div class="col-md-6">
                        <div class="row">
                            <Button id="run" fn={run}>Create 1,000 rows</Button>
                            <Button id="runlots" fn={runLots}>Create 10,000 rows</Button>
                            <Button id="add" fn={add}>Append 1,000 rows</Button>
                            <Button id="update" fn={update}>Update every 10th row</Button>
                            <Button id="clear" fn={clear}>Clear</Button>
                            <Button id="swaprows" fn={swapRows}>Swap Rows</Button>
                        </div>
                    </div>
                </div>
            </div>
            <table class="table table-hover table-striped test-data">
                <tbody>
                    <For each={data}>
                        {row => {
                            const rowId = row.id;
                            return (
                                <tr class={() => selected.get() === rowId ? "danger" : ""}>
                                    <td class="col-md-1">{rowId}</td>
                                    <td class="col-md-4">
                                        <a onclick={() => selected.set(rowId)}>{row.label}</a>
                                    </td>
                                    <td class="col-md-1">
                                        <a onclick={() => data.splice(data.findIndex(d => d.id === rowId), 1)}>
                                            <span class="glyphicon glyphicon-remove" aria-hidden="true" />
                                        </a>
                                    </td>
                                    <td class="col-md-6" />
                                </tr>
                            );
                        }}
                    </For>
                </tbody>
            </table>
            <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
        </div>
    );
}));
