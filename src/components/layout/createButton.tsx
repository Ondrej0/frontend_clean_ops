export function CreateButton({ url, text }: { url: string, text: string }) {
    return (
        //TODO - make the create more universal, make it take text to display
        <button onClick={()=> {window.location.href = url}}>{text}</button>
    )
}
