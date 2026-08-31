import {CreateButton} from "@/components/layout/createButton.tsx";

export function ManagerSites(){
    return (
        <>
            <h1>This is the Manager Sites Page</h1>
            <CreateButton url={"/manager/sites/create"}/>
        </>

    )
}