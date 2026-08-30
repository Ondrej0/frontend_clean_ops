import {Card, CardTitle, CardDescription} from "@/components/ui/card.tsx";

type EmployeeCardProps = {
    size: "sm" | "md" | "lg";
    title: string;
    description: string;
};

export function EmployeeCard({ size, title, description }: EmployeeCardProps) {

    const sizeClasses = {
        sm: "w-48 h-32",
        md: "w-64 h-40",
        lg: "w-80 h-48",
    };

    return (
        <Card className={sizeClasses[size]}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </Card>
    );
}