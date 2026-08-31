import {useState} from "react";
import type { ChangeEvent, SubmitEvent } from "react";

interface Site {
    tenantID: string | null;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
}

export function CreateSiteForm(){
    const [site, setSite] = useState<Site>({
        tenantID: null,
        name: "",
        addressLine1: "",
        city: "",
        postcode: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setSite((previousSite)=> ({
            ...previousSite,
            [name]: value,
        }));

        setError(null);
        setSuccess(false);
    };

    //TODO add handles submit
}