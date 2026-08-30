import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

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
        //TODO hard code tenant ID -- maybe in config file for now
        tenantId: null,
        firstName: "",
        lastName: "",
        password: "",
        email: "",
        payRate: ""
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmployee({ ...employee, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            //TODO add base url to the fetch request -- maybe a add config file?
            const res = await fetch("api/employee", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create employee');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="firstName" value={employee.firstName} onChange={handleChange} placeholder="First Name" />
            <input name="lastName" value={employee.lastName} onChange={handleChange} placeholder="Last name" />
            <input name="password" value={employee.password} onChange={handleChange} placeholder="Password" />
            <input name="email" value={employee.email} onChange={handleChange} placeholder="Email" />
            <input name="payRate" value={employee.payRate} onChange={handleChange} placeholder="Pay Rate" />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Employee'}</button>
        </form>
    );
}