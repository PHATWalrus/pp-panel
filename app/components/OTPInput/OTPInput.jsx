import React, { useRef, useEffect, useCallback, useState } from 'react';

/**
 * A robust, accessible OTP (One-Time Password) input component optimized for mobile devices.
 * Uses a hidden input strategy to eliminate common mobile typing issues while providing
 * visual feedback through display inputs with proper cursor positioning.
 *
 * @param {Object} props - The component props
 * @param {string} [props.value=''] - The controlled value of the OTP input
 * @param {(value: string) => void} [props.onChange] - Callback fired when the value changes
 * @param {(value: string) => void} [props.onComplete] - Callback fired when all fields are filled
 * @param {number} [props.length=6] - Number of input fields to display
 * @param {boolean} [props.autoFocus=true] - Whether to auto-focus the first input on mount
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {boolean} [props.required=false] - Whether the input is required for form validation
 * @param {string} [props.placeholder=''] - Placeholder text for empty fields
 * @param {string} [props.className=''] - CSS class name for the container element
 * @param {string} [props.inputClassName=''] - CSS class name for individual input fields
 * @param {boolean} [props.allowAlphanumeric=false] - Whether to allow letters in addition to numbers
 * @param {string} [props['aria-label']='Enter verification code'] - Accessible label for the input group
 * @param {string} [props['aria-describedby']] - ID of element that describes the input group
 * @param {string} [props.id] - Base ID for the inputs (will be suffixed with field index)
 * @returns {JSX.Element} The OTP input component
 */
export const OTPInput = ({
  value = '',
  onChange,
  onComplete,
  length = 6,
  autoFocus = true,
  disabled = false,
  required = false,
  placeholder = '',
  className = '',
  inputClassName = '',
  allowAlphanumeric = false,
  'aria-label': ariaLabel = 'Enter verification code',
  'aria-describedby': ariaDescribedby,
  onFocus,
  id,
  ...props
}) => {
  const hiddenInputRef = useRef(null);
  const displayInputRefs = useRef([]);
  const containerRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const selectionTimeoutRef = useRef(null);

  // Initialize refs array
  useEffect(() => {
    displayInputRefs.current = displayInputRefs.current.slice(0, length);
  }, [length]);

  // Convert value string to array for rendering display inputs.
  const valueArray = value.split('').slice(0, length);
  while (valueArray.length < length) {
    valueArray.push('');
  }

  /**
   * Synchronizes the visual `focusedIndex` with the hidden input's `selectionStart`.
   */
  const handleSelectionChange = useCallback(() => {
    if (hiddenInputRef.current && isFocused) {
      const currentSelectionStart = hiddenInputRef.current.selectionStart ?? 0;
      const newFocusedIndex = Math.min(currentSelectionStart, length - 1);
      setFocusedIndex(Math.max(0, newFocusedIndex));
    }
  }, [isFocused, length]);

  // Auto focus hidden input
  useEffect(() => {
    if (autoFocus && hiddenInputRef.current && !disabled) {

      hiddenInputRef.current.focus();

      // Ensure selection is at the start for initial focus.
      // This helps with cursor position and might aid keyboard appearance on mobile.
      hiddenInputRef.current.setSelectionRange(0, 0);
      // The onFocus handler (handleHiddenInputFocus) will be triggered by .focus()
      // and will then call handleSelectionChange to set the focusedIndex.
    }
  }, [autoFocus]); // Corrected dependencies

  /**
   * Effect to manage the hidden input's selection based on visual focus and content.
   * This ensures that typing replaces characters in filled slots and inserts in empty ones.
   */
  useEffect(() => {
    if (isFocused && hiddenInputRef.current && focusedIndex >= 0 && focusedIndex < length) {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      selectionTimeoutRef.current = setTimeout(() => {
        if (hiddenInputRef.current && isFocused) {
          requestAnimationFrame(() => {
            if (hiddenInputRef.current) {
              if (value.charAt(focusedIndex)) { // Use value.charAt instead of valueArray for directness
                hiddenInputRef.current.setSelectionRange(focusedIndex, focusedIndex + 1);
              } else {
                hiddenInputRef.current.setSelectionRange(focusedIndex, focusedIndex);
              }
            }
          });
        }
      }, 10);
    }

    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [isFocused, focusedIndex, value, length]); // valueArray removed, value and length are direct dependencies

  /**
   * Handles changes from the hidden input (captures all typing, paste, etc.)
   */
  const handleHiddenInputChange = useCallback((e) => {
    const rawValue = e.target.value;
    const filteredValue = rawValue.split('').filter(char => {
      if (allowAlphanumeric) {
        return /^[a-zA-Z0-9]$/.test(char);
      }
      return /^[0-9]$/.test(char);
    }).join('');

    const newValue = filteredValue.slice(0, length);
    onChange?.(newValue);

    if (hiddenInputRef.current) {
      const newPos = Math.min(newValue.length, length - 1);
      setFocusedIndex(newPos);
    }

    if (newValue.length === length && onComplete) {
      onComplete(newValue);
      // Parent component should handle blurring or disabling if needed post-completion.
    }
  }, [onChange, onComplete, length, allowAlphanumeric]);

  /**
   * Handles keyboard navigation on the hidden input
   */
  const handleHiddenInputKeyDown = useCallback((e) => {
    const currentVal = value;
    const currentSelectionStart = hiddenInputRef.current?.selectionStart ?? 0;
    let newPos;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (hiddenInputRef.current) {
        newPos = Math.max(0, currentSelectionStart - 1);
        hiddenInputRef.current.setSelectionRange(newPos, newPos);
        handleSelectionChange();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (hiddenInputRef.current) {
        newPos = Math.min(currentVal.length, currentSelectionStart + 1);
        newPos = Math.min(newPos, length); // Ensure newPos does not exceed overall length
        hiddenInputRef.current.setSelectionRange(newPos, newPos);
        handleSelectionChange();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (hiddenInputRef.current) {
        hiddenInputRef.current.setSelectionRange(0, 0);
        handleSelectionChange();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (hiddenInputRef.current) {
        const endPos = Math.min(currentVal.length, length);
        hiddenInputRef.current.setSelectionRange(endPos, endPos);
        handleSelectionChange();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentVal.length === length && onComplete) {
        onComplete(currentVal);
      }
    }
  }, [value, length, onComplete, handleSelectionChange]);

  // Listen for selection changes on the hidden input
  useEffect(() => {
    const hiddenInput = hiddenInputRef.current;
    if (hiddenInput) {
      const selectionHandler = () => {
        requestAnimationFrame(() => handleSelectionChange());
      };
      // 'select' event covers manual text selection by the user or programmatic selection changes.
      hiddenInput.addEventListener('select', selectionHandler);
      // 'input' and 'keyup' listeners for handleSelectionChange removed as they are
      // handled by handleHiddenInputChange and handleHiddenInputKeyDown respectively.
      return () => {
        hiddenInput.removeEventListener('select', selectionHandler);
      };
    }
  }, [handleSelectionChange]);

  /**
   * Handles focus on the hidden input
   */
  const handleHiddenInputFocus = useCallback(() => {
    onFocus?.();
    setIsFocused(true);
    // Call handleSelectionChange after a microtask to ensure `isFocused` state is updated
    // and any selection changes from the .focus() call are picked up.
    setTimeout(() => handleSelectionChange(), 0);
  }, [onFocus, handleSelectionChange, length]); // length is a dep of handleSelectionChange via closure

  /**
   * Handles blur on the hidden input
   */
  const handleHiddenInputBlur = useCallback(() => {
    // Only set to false if not about to re-focus on a display input (which would re-trigger focus)
    // This simple version is usually fine; complex scenarios might need relatedTarget checks.
    setIsFocused(false);
  }, []);

  /**
   * Handles clicks on display inputs to position cursor
   */
  const handleDisplayInputClick = useCallback((index) => {
    if (disabled) return;
    // onFocus prop will be called by handleHiddenInputFocus when the hidden input actually focuses.
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus(); // This will trigger handleHiddenInputFocus

      // Immediately align hidden input's selection with the clicked display cell.
      const charExists = value.charAt(index);
      if (charExists) {
        hiddenInputRef.current.setSelectionRange(index, index + 1);
      } else {
        hiddenInputRef.current.setSelectionRange(index, index);
      }
      setFocusedIndex(index); // Update visual state.
    }
  }, [disabled, value, length]); // Removed onFocus, added value, length

  /**
   * Handles container clicks to focus the hidden input
   */
  const handleContainerClick = useCallback((e) => {
    // Focus only if the click is directly on the container and not on a display input.
    if (e.target === containerRef.current && !disabled && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      // After focusing, set cursor to the end of current value or first empty slot.
      const currentValLength = value.length;
      const targetPos = Math.min(currentValLength, length - 1);
      hiddenInputRef.current.setSelectionRange(targetPos, targetPos);
      setFocusedIndex(targetPos);
    }
  }, [disabled, value, length]);

  /**
   * Effect to handle component becoming disabled (e.g., after submission)
   */
  useEffect(() => {
    if (disabled) {
      setIsFocused(false); // Turn off visual focus styling
      // If the hidden input is currently focused, blur it.
      // This helps prevent keyboard/selection issues on a disabled input, like Safari's selection artifact.
      if (hiddenInputRef.current && document.activeElement === hiddenInputRef.current) {
        hiddenInputRef.current.blur();
      }
    }
  }, [disabled]);


  // Cursor styles
  const cursorStyle = {
    display: 'inline-block',
    width: '1px',
    height: '1.3em',
    backgroundColor: 'currentColor',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'otp-blink 1s infinite',
    pointerEvents: 'none'
  };

  return (
    <>
      <style>{`
        @keyframes otp-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      <div
        ref={containerRef}
        className={`otp-input-container ${className}`}
        role="group"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        onClick={handleContainerClick}
        data-focused={isFocused}
        data-disabled={disabled}
        style={{
          display: 'flex',
          gap: '8px',
          position: 'relative'
        }}
        {...props}
      >
        <input
          // autoFocus prop is handled by the useEffect for more control on mobile
          ref={hiddenInputRef}
          //autoFocus={autoFocus}
          autoFocus
          type={allowAlphanumeric ? "text" : "tel"}
          inputMode={allowAlphanumeric ? "text" : "numeric"}
          pattern={allowAlphanumeric ? "[a-zA-Z0-9]*" : "[0-9]*"}
          value={value}
          onChange={handleHiddenInputChange}
          onKeyDown={handleHiddenInputKeyDown}
          onFocus={handleHiddenInputFocus}
          onBlur={handleHiddenInputBlur}
          disabled={disabled}
          required={required}
          autoComplete="one-time-code"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label={ariaLabel} // Main aria-label is on group, this could be removed or be more specific if needed
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            zIndex: -1, // Keep zIndex to ensure it's behind display inputs but still interactive
            pointerEvents: 'auto', // Must be auto to receive focus and events
            fontSize: '16px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            // userSelect: 'none' could be added here if Safari issue persists, but blur() should be enough
          }}
          id={id}
        // Removed autoFocus HTML attribute here, relying on useEffect for autoFocus logic
        />

        {Array.from({ length }, (_, idx) => (
          <div
            key={idx}
            ref={(el) => (displayInputRefs.current[idx] = el)}
            onClick={() => handleDisplayInputClick(idx)}
            className={`otp-input-field ${inputClassName}`}
            role="textbox" // Semantically, these are part of the larger textbox concept
            aria-hidden="true" // True text input is the hidden one
            data-index={idx}
            data-focused={isFocused && focusedIndex === idx}
            data-filled={!!valueArray[idx]} // Use valueArray here for display
            data-disabled={disabled}
            style={{
              position: 'relative',
              cursor: disabled ? 'default' : 'text',
              userSelect: 'none',
              minWidth: '2.5em',
              minHeight: '2.5em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2em',
            }}
          >
            {valueArray[idx] || placeholder}
            {isFocused && focusedIndex === idx && !valueArray[idx] && (
              <span
                className="otp-cursor"
                style={cursorStyle}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
};