import { useEffect, useId, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { LoaderCircle, Search, UserPlus } from "lucide-react";
import { getCleaners, type Employee } from "@/lib/employee";
import type { AssignedCleaner } from "@/lib/schedules";

interface AssignCleanerControlProps {
    assignedCleaners: AssignedCleaner[];
    assigning: boolean;
    onAssign: (employee: Employee) => Promise<boolean>;
}

function employeeLabel(employee: Employee) {
    return `${employee.firstName} ${employee.lastName}`.trim() || employee.email;
}

export function AssignCleanerControl({ assignedCleaners, assigning, onAssign }: AssignCleanerControlProps) {
    const inputId = useId();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [selected, setSelected] = useState<Employee | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let active = true;
        getCleaners()
            .then((data) => { if (active) setEmployees(data); })
            .catch(() => { if (active) setError("Unable to load employees."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [attempt]);

    const availableEmployees = employees.filter((employee) =>
        !assignedCleaners.some((cleaner) => cleaner.cleanerId === employee.id));
    const canAssign = selected !== null && availableEmployees.some((employee) => employee.id === selected.id);

    async function handleAssign() {
        if (!selected || !canAssign || assigning) return;
        if (await onAssign(selected)) {
            setSelected(null);
            setQuery("");
        }
    }

    return (
        <div className="w-full xl:w-auto xl:min-w-[28rem]">
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">Search employees</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Combobox.Root
                    items={availableEmployees}
                    value={selected}
                    inputValue={query}
                    onValueChange={setSelected}
                    onInputValueChange={(value, details) => {
                        setQuery(value);
                        if (details.reason === "input-change") setSelected(null);
                    }}
                    itemToStringLabel={employeeLabel}
                    isItemEqualToValue={(employee, value) => employee.id === value.id}
                    filter={(employee, search) => `${employeeLabel(employee)} ${employee.email}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())}
                    disabled={loading || !!error || assigning}
                    autoHighlight
                >
                    <div className="relative min-w-0 flex-1">
                        {loading ? <LoaderCircle aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 animate-spin text-slate-400" /> : <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />}
                        <Combobox.Input
                            id={inputId}
                            placeholder={loading ? "Loading employees…" : "Search by name or email…"}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                        />
                    </div>
                    <Combobox.Portal>
                        <Combobox.Positioner sideOffset={6} className="z-50 w-[var(--anchor-width)]">
                            <Combobox.Popup className="max-h-[min(var(--available-height),20rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                                <Combobox.Empty className="px-3 py-4 text-sm text-slate-500">
                                    {employees.length === 0 ? "No employees available." : availableEmployees.length === 0 ? "All employees are already assigned." : "No matching employees."}
                                </Combobox.Empty>
                                <Combobox.List>
                                    {(employee: Employee) => (
                                        <Combobox.Item key={employee.id} value={employee} className="cursor-pointer rounded-lg px-3 py-2 text-slate-800 outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-800">
                                            <p className="text-sm font-semibold">{employeeLabel(employee)}</p>
                                            <p className="break-all text-xs text-slate-500">{employee.email}</p>
                                        </Combobox.Item>
                                    )}
                                </Combobox.List>
                            </Combobox.Popup>
                        </Combobox.Positioner>
                    </Combobox.Portal>
                </Combobox.Root>
                <button type="button" onClick={() => void handleAssign()} disabled={!canAssign || assigning || loading || !!error} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                    {assigning ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                    {assigning ? "Assigning…" : "Assign cleaner"}
                </button>
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-red-700">{error} <button type="button" onClick={() => { setError(""); setLoading(true); setAttempt((value) => value + 1); }} className="font-semibold underline">Try again</button></p>}
        </div>
    );
}
