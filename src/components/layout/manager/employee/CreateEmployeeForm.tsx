import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import {config} from "@/config/config.ts";

interface Employee {
    tenantId: string | null;
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    payRate: string;
}

export function CreateEmployeeForm() {
    const [employee, setEmployee] = useState<Employee>({
        // TODO: Replace with the authenticated manager's tenant ID
        tenantId: null,
        firstName: "",
        lastName: "",
        password: "",
        email: "",
        payRate: "",
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
                password: "",
                email: "",
                payRate: "",
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

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="firstName">First Name</label>
                <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={employee.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="lastName">Last Name</label>
                <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={employee.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={employee.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="password">Temporary Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={employee.password}
                    onChange={handleChange}
                    placeholder="Temporary Password"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="payRate">Pay Rate (£/hour)</label>
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
                />
            </div>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {success && (
                <p role="status" style={{ color: "green" }}>
                    Employee created successfully.
                </p>
            )}

            <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Employee"}
            </button>
        </form>
    );
}