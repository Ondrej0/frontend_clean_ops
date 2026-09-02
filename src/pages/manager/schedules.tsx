import {CreateButton} from "@/components/layout/createButton.tsx";

export function Schedules(){
    return (
        <>
            <h1>This is the Schedules Page</h1>
            <CreateButton url={"/manager/schedules/create"} text={"Create Schedule"} />
        </>
    )
}