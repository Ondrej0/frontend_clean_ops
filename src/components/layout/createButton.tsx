export function CreateButton({ url }: { url: string }) {
    return (
        <button onClick={()=> {window.location.href = url}}>New Employee</button>
    )
}
