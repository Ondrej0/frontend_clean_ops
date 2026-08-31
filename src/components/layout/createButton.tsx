export function CreateButton({ url }: { url: string }) {
    return (
        //TODO - make the create more universal, make it take text to display
        <button onClick={()=> {window.location.href = url}}>New Employee</button>
    )
}
