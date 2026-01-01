import { getTokenPayload } from "@/lib/auth";
import { NextResponse } from "next/server";
import { userService } from "@/services/user-service";

export async function GET(request: Request) {
  try {
    const payload = await getTokenPayload();

    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const user = await userService.getUserById(payload.userSession.userId);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener el usuario" },
      { status: 500 }
    );
  }
}
