import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../components/Pagination';

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} total={5} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Previous on the first page and Next on the last page', () => {
    render(<Pagination page={1} totalPages={3} total={30} onPageChange={() => {}} />);
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('calls onPageChange with the next page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} total={30} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
