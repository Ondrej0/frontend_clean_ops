import {EmployeeCard} from "@/components/layout/manager/employee/EmployeeCard.tsx";
import {CreateButton} from "@/components/layout/createButton.tsx";

export function Employees(){
    return (
        <>
            <h1>This is Employees Page</h1>
            <CreateButton url={"/manager/employees/create"} />
            <EmployeeCard size={"sm"} title={"My cool card"} description={"This is my cool card description"} />
            <EmployeeCard size={"md"} title={"My cool card"} description={"This is my cool card description"} />
            <EmployeeCard size={"lg"} title={"My cool card"} description={"This is my cool card description"} />
        </>

    )
}