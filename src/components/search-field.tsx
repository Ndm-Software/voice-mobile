import type { TextInputProps } from 'react-native';

import { TextField } from './text-field';

type SearchFieldProps = Omit<TextInputProps, 'style'>;

export function SearchField({ placeholder = 'Ara...', ...props }: SearchFieldProps) {
  return (
    <TextField
      accessibilityLabel={props.accessibilityLabel ?? placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      leadingIcon="search"
      placeholder={placeholder}
      returnKeyType="search"
      {...props}
    />
  );
}
