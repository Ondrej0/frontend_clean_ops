import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import {config} from "@/config/config.ts";
import { PageBackLink } from "@/components/layout/PageBackLink";

interface Employee {
    tenantId: string | null;
    firstName: string;
    lastName: string;
    passwordHash: string;
    email: string;
    payRate: number;
}

export function CreateEmployeeForm() {
    const [employee, setEmployee] = useState<Employee>({
        // TODO: Replace with the authenticated manager's tenant ID
        tenantId: config.testTenant,
        firstName: "",
        lastName: "",
        passwordHash: "",
        email: "",
        payRate: 0,
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setEmployee((previousEmployee) => ({
            ...previousEmployee,
            [name]: value,
        }));

        // Clear messages when the user starts editing again
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            //TODO add base URL to the end point, have a config file in the in here
            const response = await fetch(`${config.apiBaseUrl}/api/cleaner`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(employee),
            });

            if (!response.ok) {
                let errorMessage = "Failed to create employee.";

                try {
                    const data = await response.json();

                    if (data.message) {
                        errorMessage = data.message;
                    }
                } catch {
                    // Response wasn't valid JSON, so use the default message
                }

                setError(errorMessage);
                return;
            }

            setSuccess(true);

            // Reset the form after successful creation
            setEmployee({
                tenantId: employee.tenantId,
                firstName: "",
                lastName: "",
                passwordHash: "",
                email: "",
                payRate: 0,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while creating the employee."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClasses =
        "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

    const labelClasses = "mb-1.5 block text-sm font-medium text-slate-700";

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-2xl">
                <PageBackLink to="/manager/employees">Back to employees</PageBackLink>
                {/* Page heading */}
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">People</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                        Add Employee
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Create an account for a new cleaner and set their starting pay rate.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="firstName" className={labelClasses}>First name</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={employee.firstName}
                                onChange={handleChange}
                                placeholder="First name"
                                required
                                disabled={loading}
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className={labelClasses}>Last name</label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={employee.lastName}
                                onChange={handleChange}
                                placeholder="Last name"
                                required
                                disabled={loading}
                                className={inputClasses}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="email" className={labelClasses}>Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={employee.email}
                                onChange={handleChange}
                                placeholder="Email"
                                required
                                disabled={loading}
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label htmlFor="passwordHash" className={labelClasses}>Temporary password</label>
                            <input
                                id="passwordHash"
                                name="passwordHash"
                                type="password"
                                value={employee.passwordHash}
                                onChange={handleChange}
                                placeholder="Temporary password"
                                required
                                disabled={loading}
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label htmlFor="payRate" className={labelClasses}>Pay rate (£/hour)</label>
                            <input
                                id="payRate"
                                name="payRate"
                                type="number"
                                value={employee.payRate}
                                onChange={handleChange}
                                placeholder="e.g. 12.50"
                                min="0"
                                step="0.01"
                                required
                                disabled={loading}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p role="status" className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                            Employee created successfully.
                        </p>
                    )}

                    <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
                        >
                            {loading ? "Creating…" : "Create employee"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
