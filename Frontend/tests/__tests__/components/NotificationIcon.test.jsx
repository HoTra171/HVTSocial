import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import NotificationIcon from '../../../src/components/Notification/NotificationIcon.jsx';

describe('NotificationIcon', () => {
  it('should render heart icon for like type', () => {
    const { container } = render(<NotificationIcon type="like" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveClass('text-red-500');
  });

  it('should render message icon for comment type', () => {
    const { container } = render(<NotificationIcon type="comment" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveClass('text-blue-500');
  });

  it('should render user plus icon for friend_request type', () => {
    const { container } = render(<NotificationIcon type="friend_request" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveClass('text-indigo-500');
  });

  it('should render share icon for other type with share content', () => {
    const { container } = render(
      <NotificationIcon type="other" content="chia sẻ bài viết" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveClass('text-green-500');
  });

  it('should render default bell icon for unknown type', () => {
    const { container } = render(<NotificationIcon type="unknown" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveClass('text-gray-500');
  });
});
