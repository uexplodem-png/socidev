import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)}
            {...props}
        >
            {children}
        </div>
    );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, className, ...props }) => {
    return (
        <h3
            className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}
            {...props}
        >
            {children}
        </h3>
    );
};

const CardContent: React.FC<CardContentProps> = ({ children, className, ...props }) => {
    return (
        <div className={cn('p-6', className)} {...props}>
            {children}
        </div>
    );
};

export { Card, CardHeader, CardTitle, CardContent };
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps };