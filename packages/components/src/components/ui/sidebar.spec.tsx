import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";

const SidebarWrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
);

describe("SidebarProvider", () => {
  it("renders children", () => {
    render(
      <SidebarProvider>
        <span>child</span>
      </SidebarProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("sets data-slot attribute on wrapper", () => {
    const { container } = render(<SidebarProvider />);
    expect(container.firstChild).toHaveAttribute("data-slot", "sidebar-wrapper");
  });
});

describe("Sidebar (collapsible=none)", () => {
  it("renders", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <span>content</span>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none" />
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar"]')).toBeInTheDocument();
  });
});

describe("SidebarHeader", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarHeader />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-header"]')).toBeInTheDocument();
  });
});

describe("SidebarFooter", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarFooter />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-footer"]')).toBeInTheDocument();
  });
});

describe("SidebarContent", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarContent />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-content"]')).toBeInTheDocument();
  });
});

describe("SidebarGroup", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarGroup />
          </SidebarContent>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-group"]')).toBeInTheDocument();
  });
});

describe("SidebarGroupLabel", () => {
  it("renders children", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(screen.getByText("Navigation")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarGroupLabel>Label</SidebarGroupLabel>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-group-label"]')).toBeInTheDocument();
  });
});

describe("SidebarGroupContent", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarGroupContent />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-group-content"]')).toBeInTheDocument();
  });
});

describe("SidebarMenu", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenu />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu"]')).toBeInTheDocument();
  });
});

describe("SidebarMenuItem", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem />
          </SidebarMenu>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-item"]')).toBeInTheDocument();
  });
});

describe("SidebarMenuButton", () => {
  it("renders children", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Dashboard</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenuButton>Button</SidebarMenuButton>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-button"]')).toBeInTheDocument();
  });
});

describe("SidebarMenuBadge", () => {
  it("renders children", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenuBadge>3</SidebarMenuBadge>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenuBadge>1</SidebarMenuBadge>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-badge"]')).toBeInTheDocument();
  });
});

describe("SidebarMenuSkeleton", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenuSkeleton />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-skeleton"]')).toBeInTheDocument();
  });
});

describe("SidebarMenuSub", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenuSub />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-sub"]')).toBeInTheDocument();
  });
});

describe("SidebarMenuSubItem", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarMenuSub>
            <SidebarMenuSubItem />
          </SidebarMenuSub>
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-sub-item"]')).toBeInTheDocument();
  });
});

describe("SidebarSeparator", () => {
  it("sets data-slot attribute", () => {
    render(
      <SidebarWrapper>
        <Sidebar collapsible="none">
          <SidebarSeparator />
        </Sidebar>
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-separator"]')).toBeInTheDocument();
  });
});

describe("SidebarTrigger", () => {
  it("renders a button", () => {
    render(
      <SidebarWrapper>
        <SidebarTrigger />
      </SidebarWrapper>,
    );
    expect(document.querySelector('[data-slot="sidebar-trigger"]')).toBeInTheDocument();
  });
});

describe("SidebarInset", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<SidebarInset />);
    expect(container.firstChild).toHaveAttribute("data-slot", "sidebar-inset");
  });
});
