// Создаем класс taskManager
// Тестируем основные  методы
// Создадим класс Logger и добавить его как DI в taskManager
//

// AAA
// Arrange - Подготавливаем моковые данные
// Act - Выполняем действие над моковыми данными
// Assert - Проверяем результат действия
//
// Fixtures - Подмененные данные с бэкенда
// Stubs - Позволяет подменить сложные функции на заглушки
// Mock -
// Spy - Позволяет отслеживать вызовы функций
//
// const mockData = {
// users: [{id: 1, name: 'John Doe', email: 'john.doe@example.com'}],
// tasks: [{id: 1, title: 'Task 1', description: 'Description 1', userId: 1}]
// }
//
// const mockData = {
// users: [{id: 1, name: 'John Doe', email: 'john.doe@example.com'}],
// tasks: [{id: 1, title: 'Task 1', description: 'Description 1', userId: 1}],
//
// }
//
//

// import { expect, test, vi } from "vitest";

// // frontend
// declare function getUserEmail(userId: number): Promise<User["email"]>;

// const mockData = {
//   users: [{ id: 1, name: "John Doe", email: "john.doe@example.com" }],
//   tasks: [{ id: 1, title: "Task 1", description: "Description 1", userId: 1 }],
// };

// test("getUserEmail", () => {
//   expect(getUserEmail(1)).toBe("john.doe@example.com");
// });

// // backend
// type User = {
//   id: number;
//   name: string;
//   email: string;
// };

// const getApples = vi.fn(() => 0);

// // Act
// getApples();

// // Assert
// expect(getApples).toHaveBeenCalled();
// expect(getApples).toHaveReturnedWith(0);

// getApples.mockReturnValueOnce(5);

// const res = getApples();
// expect(res).toBe(5);
// expect(getApples).toHaveNthReturnedWith(2, 5);
//

// let apples = 0;
// const cart = {
//   getApples: () => 42,
// };

// const spy = vi.spyOn(cart, "getApples").mockImplementation(() => apples);
// apples = 1;

// expect(cart.getApples()).toBe(1);

// expect(spy).toHaveBeenCalled();
// expect(spy).toHaveReturnedWith(1);
//

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
};

export class TaskManager {
  private tasks: Task[] = [];

  constructor(logger) {}

  addTask(title: string) {
    const task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  getTasks() {
    return this.tasks;
  }

  findTaskById(id: string) {
    return this.tasks.find((task) => task.id === id);
  }

  completeTask(id: string) {
    const task = this.findTaskById(id);
    if (!task) return false;
    task.completed = true;
    return true;
  }
}
