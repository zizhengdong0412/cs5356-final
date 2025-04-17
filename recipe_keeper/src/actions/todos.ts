"use server"

import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { db } from "@/database/db"
import { todos } from "@/database/schema"

export async function createTodo(_: any, formData: FormData) {
    /* YOUR CODE HERE */
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return { error: "Unauthorized", success: false }

    const title = (formData.get("title") as string | null)?.trim() ?? ""
    if (title === "") return { error: "Todo title can't be empty", success: false }

    await new Promise(r => setTimeout(r, 1_000))

    await db.insert(todos).values({ title, userId: session.user.id })
    revalidatePath("/todos")
    return { success: true }
}

export async function toggleTodo(formData: FormData) {
    /* YOUR CODE HERE */
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return { error: "Unauthorized", success: false }

    const id = formData.get("id") as string

    const todo = await db.query.todos.findFirst({
        where: (t, { eq }) => eq(t.id, id),
    })
    if (!todo || todo.userId !== session.user.id) {
        return { error: "Forbidden", success: false }
    }

    await db
        .update(todos)
        .set({ completed: !todo.completed })
        .where(eq(todos.id, id))

    revalidatePath("/todos")
    return { success: true }
}

export async function deleteTodo(formData: FormData) {
    /* YOUR AUTHORIZATION CHECK HERE */
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
        return { success: false, error: "Admins only" };
      }
    const id = formData.get("id") as string;
    await db.delete(todos)
        .where(eq(todos.id, id));

    revalidatePath("/admin");
    return { success: true };
}
