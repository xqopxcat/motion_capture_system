import { describe, expect, it, vi } from "vitest";
import type { AnnotationMarker } from "../../types";
import { AnnotationDrawer } from "./AnnotationDrawer";

const annotations: AnnotationMarker[] = [
  {
    annotationId: "annotation_1",
    frameIndex: 12,
    timestamp: 0.4,
    title: "First marker",
  },
  {
    annotationId: "annotation_2",
    frameIndex: 48,
    jointId: 25,
    timestamp: 1.6,
    title: "Second marker",
  },
];

describe("AnnotationDrawer", () => {
  it("renders nothing when closed", () => {
    expect(AnnotationDrawer({ annotations, isOpen: false })).toBeNull();
  });

  it("renders empty state when open without annotations", () => {
    const tree = AnnotationDrawer({ annotations: [], isOpen: true });

    expect(findText(tree, "No annotations for this record yet.")).toBe(true);
  });

  it("renders selected annotation details", () => {
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      selectedAnnotationId: "annotation_2",
    });

    expect(findText(tree, "Second marker")).toBe(true);
    expect(findText(tree, "Frame")).toBe(true);
    expect(findText(tree, "48")).toBe(true);
    expect(findText(tree, "1.60")).toBe(true);
    expect(findText(tree, "Joint")).toBe(true);
    expect(findText(tree, "Joint 25")).toBe(true);
  });

  it("renders selected joint target for creation", () => {
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      selectedJointId: 12,
    });

    expect(findText(tree, "Joint target: Joint 12")).toBe(true);
  });

  it("emits selection intent when annotation is clicked", () => {
    const handleSelectAnnotation = vi.fn();
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      onSelectAnnotation: handleSelectAnnotation,
    });
    const buttons = findElementsByType(tree, "button");

    buttons[2].props.onClick();

    expect(handleSelectAnnotation).toHaveBeenCalledWith(annotations[0]);
  });

  it("emits create intent from form submission", () => {
    const handleCreateAnnotation = vi.fn();
    const reset = vi.fn();
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      onCreateAnnotation: handleCreateAnnotation,
    });
    const [form] = findElementsByType(tree, "form");

    form.props.onSubmit({
      currentTarget: {
        elements: {
          namedItem: (name: string) => ({
            value: name === "title" ? "  New marker  " : "Check alignment",
          }),
        },
        reset,
      },
      preventDefault: vi.fn(),
    });

    expect(handleCreateAnnotation).toHaveBeenCalledWith({
      note: "Check alignment",
      title: "New marker",
    });
    expect(reset).toHaveBeenCalledOnce();
  });

  it("emits update intent from edit form submission", () => {
    const handleUpdateAnnotation = vi.fn();
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      selectedAnnotationId: "annotation_1",
      onUpdateAnnotation: handleUpdateAnnotation,
    });
    const forms = findElementsByType(tree, "form");

    forms[1].props.onSubmit({
      currentTarget: {
        elements: {
          namedItem: (name: string) => ({
            value: name === "editTitle" ? "  Updated marker  " : "Updated note",
          }),
        },
      },
      preventDefault: vi.fn(),
    });

    expect(handleUpdateAnnotation).toHaveBeenCalledWith(annotations[0], {
      note: "Updated note",
      title: "Updated marker",
    });
  });

  it("emits delete intent from confirmed delete action", () => {
    const handleDeleteAnnotation = vi.fn();
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      selectedAnnotationId: "annotation_1",
      onDeleteAnnotation: handleDeleteAnnotation,
    });
    const buttons = findElementsByType(tree, "button");

    buttons[6].props.onClick();

    expect(handleDeleteAnnotation).toHaveBeenCalledWith(annotations[0]);
  });

  it("emits jump intent for the selected annotation", () => {
    const handleJumpToAnnotation = vi.fn();
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      selectedAnnotationId: "annotation_1",
      onJumpToAnnotation: handleJumpToAnnotation,
    });
    const buttons = findElementsByType(tree, "button");

    buttons[4].props.onClick();

    expect(handleJumpToAnnotation).toHaveBeenCalledWith(annotations[0]);
  });

  it("emits close intent", () => {
    const handleClose = vi.fn();
    const tree = AnnotationDrawer({
      annotations,
      isOpen: true,
      onClose: handleClose,
    });
    const [closeButton] = findElementsByType(tree, "button");

    closeButton.props.onClick();

    expect(handleClose).toHaveBeenCalledOnce();
  });
});

function findElementsByType(tree: unknown, type: string): Array<{ props: Record<string, any> }> {
  if (Array.isArray(tree)) {
    return tree.flatMap((child) => findElementsByType(child, type));
  }

  if (!tree || typeof tree !== "object") {
    return [];
  }

  const element = tree as { props?: { children?: unknown }; type?: unknown };
  const matches = element.type === type ? [{ props: element.props as Record<string, any> }] : [];
  const children = element.props?.children;

  if (Array.isArray(children)) {
    return matches.concat(children.flatMap((child) => findElementsByType(child, type)));
  }

  return matches.concat(findElementsByType(children, type));
}

function findText(tree: unknown, text: string): boolean {
  if (Array.isArray(tree)) {
    return tree.some((child) => findText(child, text));
  }

  if (tree === text) {
    return true;
  }

  if (typeof tree === "number") {
    return String(tree) === text;
  }

  if (!tree || typeof tree !== "object") {
    return false;
  }

  const element = tree as { props?: { children?: unknown } };
  const children = element.props?.children;

  if (Array.isArray(children)) {
    return children.some((child) => findText(child, text));
  }

  return findText(children, text);
}
