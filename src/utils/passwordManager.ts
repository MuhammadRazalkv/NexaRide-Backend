import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
    try {
        const hash = await bcrypt.hash(password, 10);
        return hash
    } catch (err) {
        console.error("Error hashing password:", err);
        throw new Error("Password hashing failed");
    }
}

export async function comparePassword(userPassword:string,storedPassword:string) :Promise<boolean> {
    try {
        return await bcrypt.compare(userPassword,storedPassword)
    } catch (error) {
        console.error("Error comparing password:", error);
        throw new Error("Password hashing failed");
    }
    
}


