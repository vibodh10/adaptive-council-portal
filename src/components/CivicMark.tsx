type CivicMarkProps = {
    className?: string;
};

export default function CivicMark({ className = "" }: CivicMarkProps) {
    return (
        <span
            aria-hidden="true"
            className={`grid shrink-0 place-items-center border-2 border-current ${className}`}
        >
            <svg
                viewBox="0 0 48 48"
                className="h-4/5 w-4/5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M7 13H41V19H7V13Z" fill="currentColor" />
                <path
                    d="M10 19H38V37H31V29C31 25.134 27.866 22 24 22C20.134 22 17 25.134 17 29V37H10V19Z"
                    fill="currentColor"
                />
                <path d="M5 37H43V41H5V37Z" fill="currentColor" />
            </svg>
        </span>
    );
}
