import { beforeEach, describe, expect, test, vi } from "vitest";
import { TaskManager } from "./taskManager";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
};

describe("TaskManager", () => {
  let taskManager: TaskManager;

  const fixtures: { tasks: Task[] } = {
    tasks: [
      {
        id: "1",
        title: "Test Task",
        completed: false,
        createdAt: new Date(),
      },
      {
        id: "2",
        title: "Another Test Task",
        completed: true,
        createdAt: new Date(),
      },
      {
        id: "3",
        title: "Yet Another Test Task",
        completed: false,
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    taskManager = new TaskManager();

    console.log("fixtures");
    fixtures.tasks.forEach((task) => {
      taskManager.addTask(task.title);
      if (task.completed) {
        taskManager.completeTask(task.id);
      }
    });
  });

  test("should create a new task", () => {
    // Arrange

    // Act
    const task = taskManager.addTask("Test Task");

    // Assert
    expect(task.title).toBe("Test Task");
  });

  test("should return current tasks count", () => {
    // Arrange

    // Act
    const tasks = taskManager.getTasks();

    // Assert
    expect(tasks).toHaveLength(fixtures.tasks.length);
  });

  test("should create task with fixed Date", () => {
    const fixedData = new Date("2023-01-01T00:00:00Z");
    const dateStub = vi.fn(() => fixedData);
    global.Date = dateStub as any;

    const task = taskManager.addTask("Fixed Date Task");

    expect(task.createdAt).toEqual(fixedData);
  });

  test("should call method findTask during complete task", () => {
    // Arrange
    const findTaskSpy = vi.spyOn(taskManager, "findTaskById");
    const taskId = "1";

    // Act
    taskManager.completeTask(taskId);

    // Assert
    expect(findTaskSpy).toHaveBeenCalled();
    expect(findTaskSpy).toHaveBeenCalledWith(taskId);
  });
});
